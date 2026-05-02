#!/usr/bin/env python3
"""
Translate Codex 0.125 /v1/responses calls to /v1/chat/completions on a vLLM-compatible backend.
Handles streaming SSE in both directions.

Run: python3 codex-proxy.py
Then point Codex at http://localhost:8765/v1 with wire_api="responses".
"""

import json
import os
import sys
import time
import uuid
import traceback
from aiohttp import web, ClientSession, ClientTimeout

UPSTREAM = os.environ.get("PROXY_UPSTREAM", "https://api.runpod.ai/v2/3hgeh4ygvwb6zv/openai/v1")
UPSTREAM_KEY = os.environ.get("PROXY_UPSTREAM_KEY", "")
PORT = int(os.environ.get("PROXY_PORT", "8765"))
DEFAULT_MODEL = os.environ.get("PROXY_MODEL", "huihui-ai/Huihui-Qwen3-Coder-30B-A3B-Instruct-abliterated")
DEBUG = bool(os.environ.get("PROXY_DEBUG"))


def log(*args):
    print("[proxy]", *args, file=sys.stderr, flush=True)


def responses_to_chat_request(req: dict) -> dict:
    """Translate a /v1/responses request body into a /v1/chat/completions body."""
    messages = []
    if req.get("instructions"):
        messages.append({"role": "system", "content": req["instructions"]})

    inp = req.get("input")
    if isinstance(inp, str):
        messages.append({"role": "user", "content": inp})
    elif isinstance(inp, list):
        i = 0
        while i < len(inp):
            item = inp[i]
            t = item.get("type", "message")
            if t == "message":
                role = item.get("role", "user")
                if role == "developer":
                    role = "system"
                content = item.get("content", "")
                if isinstance(content, list):
                    parts = []
                    for c in content:
                        if isinstance(c, dict):
                            text = c.get("text") or c.get("input_text") or ""
                            if text:
                                parts.append(text)
                        elif isinstance(c, str):
                            parts.append(c)
                    content = "\n".join(parts)
                messages.append({"role": role, "content": content})
                i += 1
            elif t == "function_call":
                tool_calls = []
                while i < len(inp) and inp[i].get("type") == "function_call":
                    fc = inp[i]
                    tool_calls.append({
                        "id": fc.get("call_id") or fc.get("id") or f"call_{uuid.uuid4().hex[:8]}",
                        "type": "function",
                        "function": {
                            "name": fc.get("name", ""),
                            "arguments": fc.get("arguments", ""),
                        },
                    })
                    i += 1
                messages.append({"role": "assistant", "content": None, "tool_calls": tool_calls})
            elif t == "function_call_output":
                messages.append({
                    "role": "tool",
                    "tool_call_id": item.get("call_id") or item.get("id", ""),
                    "content": item.get("output", ""),
                })
                i += 1
            elif t == "reasoning":
                i += 1
            else:
                log(f"unhandled input item type: {t}; dropping")
                i += 1

    chat_tools = None
    if req.get("tools"):
        chat_tools = []
        for tool in req["tools"]:
            if tool.get("type") == "function":
                if "function" in tool:
                    chat_tools.append(tool)
                else:
                    chat_tools.append({
                        "type": "function",
                        "function": {
                            "name": tool.get("name"),
                            "description": tool.get("description", ""),
                            "parameters": tool.get("parameters", {}),
                        },
                    })

    body = {
        "model": req.get("model") or DEFAULT_MODEL,
        "messages": messages,
        "stream": bool(req.get("stream", False)),
    }
    if chat_tools:
        body["tools"] = chat_tools
    if req.get("tool_choice"):
        body["tool_choice"] = req["tool_choice"]
    if req.get("temperature") is not None:
        body["temperature"] = req["temperature"]
    if req.get("top_p") is not None:
        body["top_p"] = req["top_p"]
    if req.get("max_output_tokens") is not None:
        body["max_tokens"] = req["max_output_tokens"]
    return body


def make_response_envelope(model: str, response_id: str) -> dict:
    return {
        "id": response_id,
        "object": "response",
        "created_at": int(time.time()),
        "model": model,
        "status": "in_progress",
        "output": [],
    }


def chat_choice_to_output_items(choice: dict) -> list:
    msg = choice.get("message", {})
    items = []
    content = msg.get("content")
    tool_calls = msg.get("tool_calls") or []
    if content:
        items.append({
            "type": "message",
            "id": f"msg_{uuid.uuid4().hex[:12]}",
            "role": "assistant",
            "status": "completed",
            "content": [{"type": "output_text", "text": content, "annotations": []}],
        })
    for tc in tool_calls:
        fn = tc.get("function", {})
        items.append({
            "type": "function_call",
            "id": f"fc_{uuid.uuid4().hex[:12]}",
            "call_id": tc.get("id") or f"call_{uuid.uuid4().hex[:8]}",
            "name": fn.get("name", ""),
            "arguments": fn.get("arguments", ""),
            "status": "completed",
        })
    return items


def sse_event(name: str, payload: dict) -> bytes:
    return f"event: {name}\ndata: {json.dumps(payload)}\n\n".encode()


async def handle_non_streaming(chat_req: dict, model_for_response: str):
    headers = {"Content-Type": "application/json"}
    if UPSTREAM_KEY:
        headers["Authorization"] = f"Bearer {UPSTREAM_KEY}"
    timeout = ClientTimeout(total=600)
    async with ClientSession(timeout=timeout) as sess:
        async with sess.post(f"{UPSTREAM}/chat/completions", json=chat_req, headers=headers) as r:
            if r.status != 200:
                err_text = await r.text()
                log(f"upstream error {r.status}: {err_text[:300]}")
                return web.Response(status=r.status, text=err_text, content_type="application/json")
            data = await r.json()
    response_id = f"resp_{uuid.uuid4().hex[:16]}"
    envelope = make_response_envelope(model_for_response, response_id)
    envelope["status"] = "completed"
    if data.get("choices"):
        envelope["output"] = chat_choice_to_output_items(data["choices"][0])
    if data.get("usage"):
        u = data["usage"]
        envelope["usage"] = {
            "input_tokens": u.get("prompt_tokens", 0),
            "output_tokens": u.get("completion_tokens", 0),
            "total_tokens": u.get("total_tokens", 0),
        }
    return web.json_response(envelope)


async def handle_streaming(request: web.Request, chat_req: dict, model_for_response: str):
    """
    Get a NON-streaming response from upstream, then synthesize SSE events to Codex.
    vLLM v2.14.0 with qwen3_coder parser truncates streaming tool_call args, so we
    avoid the bug by reading the complete response in one shot.
    """
    chat_req["stream"] = False
    chat_req.pop("stream_options", None)
    response_id = f"resp_{uuid.uuid4().hex[:16]}"

    headers = {"Content-Type": "application/json"}
    if UPSTREAM_KEY:
        headers["Authorization"] = f"Bearer {UPSTREAM_KEY}"

    resp = web.StreamResponse(status=200, headers={
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    })
    await resp.prepare(request)

    envelope = make_response_envelope(model_for_response, response_id)
    await resp.write(sse_event("response.created", {"type": "response.created", "response": envelope, "sequence_number": 0}))
    await resp.write(sse_event("response.in_progress", {"type": "response.in_progress", "response": envelope, "sequence_number": 1}))

    seq = 2
    text_item_id = None
    text_buffer = ""
    text_output_index = 0
    tool_items = {}
    finish_reason = None
    upstream_usage = None

    timeout = ClientTimeout(total=600)
    log(f"-> upstream POST (msgs={len(chat_req.get('messages',[]))} tools={len(chat_req.get('tools',[]) or [])})")
    try:
        async with ClientSession(timeout=timeout) as sess:
            async with sess.post(f"{UPSTREAM}/chat/completions", json=chat_req, headers=headers) as r:
                log(f"<- upstream status={r.status}")
                if r.status != 200:
                    err = await r.text()
                    log(f"!! upstream error {r.status}: {err[:300]}")
                    await resp.write(sse_event("response.failed", {"type": "response.failed", "response": {"id": response_id, "status": "failed", "error": {"message": err}}, "sequence_number": seq}))
                    await resp.write_eof()
                    return resp
                buffer = b""
                chunk_count = 0
                async for chunk in r.content.iter_any():
                    buffer += chunk
                    while b"\n\n" in buffer:
                        raw, buffer = buffer.split(b"\n\n", 1)
                        line = raw.decode("utf-8", errors="replace").strip()
                        if not line.startswith("data:"):
                            continue
                        payload = line[5:].strip()
                        if payload == "[DONE]":
                            continue
                        try:
                            data = json.loads(payload)
                        except json.JSONDecodeError:
                            continue
                        chunk_count += 1
                        # Log every chunk that contains tool_calls or finish_reason
                        for ch in data.get("choices", []):
                            d = ch.get("delta", {})
                            if d.get("tool_calls") or ch.get("finish_reason"):
                                if DEBUG:
                                    log(f"TC CHUNK {chunk_count}: {json.dumps(data)[:800]}")
                        if DEBUG and chunk_count <= 2:
                            log(f"UPSTREAM CHUNK {chunk_count}: {json.dumps(data)[:500]}")
                        if data.get("usage"):
                            upstream_usage = data["usage"]
                        for ch in data.get("choices", []):
                            delta = ch.get("delta", {})
                            fr = ch.get("finish_reason")
                            if fr:
                                finish_reason = fr
                            content = delta.get("content")
                            if content:
                                if text_item_id is None:
                                    text_item_id = f"msg_{uuid.uuid4().hex[:12]}"
                                    text_output_index = len(tool_items)
                                    await resp.write(sse_event("response.output_item.added", {
                                        "type": "response.output_item.added",
                                        "output_index": text_output_index,
                                        "item": {
                                            "type": "message",
                                            "id": text_item_id,
                                            "role": "assistant",
                                            "status": "in_progress",
                                            "content": [],
                                        },
                                        "sequence_number": seq,
                                    }))
                                    seq += 1
                                    await resp.write(sse_event("response.content_part.added", {
                                        "type": "response.content_part.added",
                                        "item_id": text_item_id,
                                        "output_index": text_output_index,
                                        "content_index": 0,
                                        "part": {"type": "output_text", "text": "", "annotations": []},
                                        "sequence_number": seq,
                                    }))
                                    seq += 1
                                text_buffer += content
                                await resp.write(sse_event("response.output_text.delta", {
                                    "type": "response.output_text.delta",
                                    "item_id": text_item_id,
                                    "output_index": text_output_index,
                                    "content_index": 0,
                                    "delta": content,
                                    "sequence_number": seq,
                                }))
                                seq += 1
                            for tc in (delta.get("tool_calls") or []):
                                idx = tc.get("index", 0)
                                entry = tool_items.get(idx)
                                if entry is None:
                                    fn = tc.get("function", {})
                                    item_id = f"fc_{uuid.uuid4().hex[:12]}"
                                    call_id = tc.get("id") or f"call_{uuid.uuid4().hex[:8]}"
                                    name = fn.get("name", "")
                                    entry = {"id": item_id, "call_id": call_id, "name": name, "args": "", "output_index": idx + (1 if text_item_id else 0)}
                                    tool_items[idx] = entry
                                    await resp.write(sse_event("response.output_item.added", {
                                        "type": "response.output_item.added",
                                        "output_index": entry["output_index"],
                                        "item": {
                                            "type": "function_call",
                                            "id": entry["id"],
                                            "call_id": entry["call_id"],
                                            "name": entry["name"],
                                            "arguments": "",
                                            "status": "in_progress",
                                        },
                                        "sequence_number": seq,
                                    }))
                                    seq += 1
                                fn = tc.get("function", {})
                                if fn.get("name") and not entry["name"]:
                                    entry["name"] = fn["name"]
                                args_chunk = fn.get("arguments")
                                if args_chunk:
                                    entry["args"] += args_chunk
                                    await resp.write(sse_event("response.function_call_arguments.delta", {
                                        "type": "response.function_call_arguments.delta",
                                        "item_id": entry["id"],
                                        "output_index": entry["output_index"],
                                        "delta": args_chunk,
                                        "sequence_number": seq,
                                    }))
                                    seq += 1
    except Exception as e:
        log(f"!! streaming exception: {e!r}")
        if DEBUG:
            log(traceback.format_exc())
        try:
            await resp.write(sse_event("response.failed", {"type": "response.failed", "response": {"id": response_id, "status": "failed", "error": {"message": str(e)}}, "sequence_number": seq}))
            await resp.write_eof()
        except Exception:
            pass
        return resp

    if text_item_id:
        await resp.write(sse_event("response.output_text.done", {
            "type": "response.output_text.done",
            "item_id": text_item_id,
            "output_index": text_output_index,
            "content_index": 0,
            "text": text_buffer,
            "sequence_number": seq,
        }))
        seq += 1
        await resp.write(sse_event("response.content_part.done", {
            "type": "response.content_part.done",
            "item_id": text_item_id,
            "output_index": text_output_index,
            "content_index": 0,
            "part": {"type": "output_text", "text": text_buffer, "annotations": []},
            "sequence_number": seq,
        }))
        seq += 1
        await resp.write(sse_event("response.output_item.done", {
            "type": "response.output_item.done",
            "output_index": text_output_index,
            "item": {
                "type": "message",
                "id": text_item_id,
                "role": "assistant",
                "status": "completed",
                "content": [{"type": "output_text", "text": text_buffer, "annotations": []}],
            },
            "sequence_number": seq,
        }))
        seq += 1

    for idx, entry in sorted(tool_items.items()):
        await resp.write(sse_event("response.function_call_arguments.done", {
            "type": "response.function_call_arguments.done",
            "item_id": entry["id"],
            "output_index": entry["output_index"],
            "arguments": entry["args"],
            "sequence_number": seq,
        }))
        seq += 1
        await resp.write(sse_event("response.output_item.done", {
            "type": "response.output_item.done",
            "output_index": entry["output_index"],
            "item": {
                "type": "function_call",
                "id": entry["id"],
                "call_id": entry["call_id"],
                "name": entry["name"],
                "arguments": entry["args"],
                "status": "completed",
            },
            "sequence_number": seq,
        }))
        seq += 1

    final_envelope = make_response_envelope(model_for_response, response_id)
    final_envelope["status"] = "completed"
    final_output = []
    if text_item_id:
        final_output.append({
            "type": "message",
            "id": text_item_id,
            "role": "assistant",
            "status": "completed",
            "content": [{"type": "output_text", "text": text_buffer, "annotations": []}],
        })
    for idx, entry in sorted(tool_items.items()):
        final_output.append({
            "type": "function_call",
            "id": entry["id"],
            "call_id": entry["call_id"],
            "name": entry["name"],
            "arguments": entry["args"],
            "status": "completed",
        })
    final_envelope["output"] = final_output
    if upstream_usage:
        final_envelope["usage"] = {
            "input_tokens": upstream_usage.get("prompt_tokens", 0),
            "output_tokens": upstream_usage.get("completion_tokens", 0),
            "total_tokens": upstream_usage.get("total_tokens", 0),
        }
    final_envelope["finish_reason"] = finish_reason
    log(f"DONE seq={seq} text_chars={len(text_buffer)} tool_calls={len(tool_items)} finish={finish_reason}")
    await resp.write(sse_event("response.completed", {"type": "response.completed", "response": final_envelope, "sequence_number": seq}))
    await resp.write_eof()
    return resp


async def responses_handler(request: web.Request):
    try:
        body = await request.json()
    except Exception as e:
        return web.json_response({"error": f"invalid json: {e}"}, status=400)
    log(f"POST /v1/responses model={body.get('model')} stream={body.get('stream')} input_items={len(body.get('input',[]) if isinstance(body.get('input'),list) else [body.get('input')])} tools={len(body.get('tools') or [])}")
    chat_req = responses_to_chat_request(body)
    if DEBUG:
        with open("/tmp/codex_last_request.json", "w") as f:
            json.dump({"responses_in": body, "chat_out": chat_req}, f, indent=2)
    model_for_response = body.get("model") or DEFAULT_MODEL
    if body.get("stream"):
        return await handle_streaming(request, chat_req, model_for_response)
    return await handle_non_streaming(chat_req, model_for_response)


async def models_handler(request: web.Request):
    short_name = DEFAULT_MODEL.split("/")[-1]
    m = {
        "id": DEFAULT_MODEL,
        "slug": DEFAULT_MODEL,
        "display_name": short_name,
        "name": short_name,
        "description": "RunPod-hosted model via local proxy",
        "object": "model",
        "created": int(time.time()),
        "owned_by": "runpod-proxy",
        "owner": "runpod-proxy",
        "provider": "runpod-proxy",
        "context_window": 32768,
        "max_context_window": 32768,
        "max_output_tokens": 8192,
        "default_max_output_tokens": 8192,
        "supports_streaming": True,
        "supports_tools": True,
        "supports_reasoning": False,
        "supports_reasoning_summaries": False,
        "supports_vision": False,
        "supports_images": False,
        "supports_audio": False,
        "supports_thinking": False,
        "is_default": True,
        "is_legacy": False,
        "is_deprecated": False,
        "is_open_source": True,
        "supported_endpoints": ["chat.completions", "responses"],
        "endpoints": ["chat.completions", "responses"],
        "tags": ["coder"],
        "family": "qwen3",
        "tier": "default",
        "training_data_cutoff": None,
        "deprecated_at": None,
        "removed_at": None,
    }
    return web.json_response({"data": [m], "models": [m], "object": "list"})


async def health_handler(request: web.Request):
    return web.json_response({"ok": True, "upstream": UPSTREAM, "model": DEFAULT_MODEL})


def main():
    if not UPSTREAM_KEY:
        log("WARN: PROXY_UPSTREAM_KEY not set")
    log(f"upstream: {UPSTREAM}")
    log(f"model: {DEFAULT_MODEL}")
    log(f"listen: http://localhost:{PORT}")
    log(f"debug: {DEBUG}")
    app = web.Application(client_max_size=200 * 1024 * 1024)
    app.router.add_post("/v1/responses", responses_handler)
    app.router.add_get("/v1/models", models_handler)
    app.router.add_get("/health", health_handler)
    web.run_app(app, host="127.0.0.1", port=PORT, access_log=None)


if __name__ == "__main__":
    main()
