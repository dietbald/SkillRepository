import win32com.client
import os
import time
import sys
import argparse

def generate_payslips(excel_path, password, payroll_sheet_name, output_folder):
    excel_path = os.path.abspath(excel_path)
    output_folder = os.path.abspath(output_folder)
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Start Excel
    try:
        excel = win32com.client.DispatchEx("Excel.Application")
        excel.Visible = False
        excel.DisplayAlerts = False
    except Exception as e:
        print(f"Excel Init Warning: {e}")
        excel = win32com.client.Dispatch("Excel.Application")

    try:
        print(f"Opening workbook: {excel_path}")
        wb = excel.Workbooks.Open(excel_path, 0, True, None, password)
        print("Workbook opened successfully!")
        time.sleep(2) 
        
        try:
            excel.Calculation = -4105 # xlCalculationAutomatic
        except:
            pass
        
        payroll_sheet = wb.Sheets(payroll_sheet_name)
        payslip_sheet = wb.Sheets("Payslip")
        
        # Get period once
        period = payslip_sheet.Range("J12").Value
        if not period:
            period = "Unknown Period"
        print(f"Period: {period}")
        safe_period = "".join([c for c in str(period) if c.isalnum() or c in (" ", "-", "_")]).strip()

        # Configure PageSetup once
        print("Configuring PageSetup...")
        try:
            payslip_sheet.PageSetup.PrintArea = "$D$1:$L$35"
            payslip_sheet.PageSetup.Orientation = 1 # xlPortrait
            payslip_sheet.PageSetup.Zoom = False
            payslip_sheet.PageSetup.FitToPagesWide = 1
            payslip_sheet.PageSetup.FitToPagesTall = 1
        except Exception as ps_error:
            print(f"Warning: Could not set PageSetup: {ps_error}")

        # Get employee names from row 9 to 100
        employees = []
        for r in range(9, 101):
            try:
                no_val = payroll_sheet.Cells(r, 2).Value # Column B (No.)
                name = payroll_sheet.Cells(r, 3).Value # Column C (Name)
                
                is_num = False
                if no_val is not None:
                    try:
                        float(no_val)
                        is_num = True
                    except (ValueError, TypeError):
                        pass

                if is_num and name and isinstance(name, str):
                    name = name.strip()
                    if name in ["Employee's Name", "Grand Total", "Prepared by:", "MARY DOFE INFANTE", "HR Department", "Approved by:", "TJ", "Director"]:
                        continue
                    if name.lower().startswith("prepared by") or name.lower().startswith("notes"):
                        continue
                    employees.append(name)
            except Exception as e:
                continue

        print(f"Found {len(employees)} employees")

        # Process each employee
        for i, name in enumerate(employees):
            print(f"[{i+1}/{len(employees)}] Generating payslip for: {name}")
            
            try:
                # Set the name in the selector cell
                payslip_sheet.Range("Q12").Value = name
                
                # Small delay for calculation
                time.sleep(1)
                
                # Define output path
                safe_name = "".join([c for c in name if c.isalnum() or c in (" ", "-", "_")]).strip()
                pdf_path = os.path.join(output_folder, f"Payslip - {safe_name} - {safe_period}.pdf")
                
                # Export
                payslip_sheet.ExportAsFixedFormat(0, pdf_path)
                
            except Exception as e:
                print(f"Error generating payslip for {name}: {e}")
                if "rejected" in str(e).lower() or "disconnected" in str(e).lower():
                    break

        print("Generation complete!")

    except Exception as e:
        print(f"Global Error: {e}")

    finally:
        if 'wb' in locals():
            try:
                wb.Close(SaveChanges=False)
            except:
                pass
        try:
            excel.Quit()
        except:
            pass
        os.system("taskkill /F /IM excel.exe >nul 2>&1")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate BICC Payslips')
    parser.add_argument('--excel', required=True, help='Path to the Excel payroll file')
    parser.add_argument('--password', default='Monthly$24', help='Excel password')
    parser.add_argument('--sheet', required=True, help='Name of the Payroll sheet')
    parser.add_argument('--output', required=True, help='Output folder for PDFs')
    
    args = parser.parse_args()
    generate_payslips(args.excel, args.password, args.sheet, args.output)
