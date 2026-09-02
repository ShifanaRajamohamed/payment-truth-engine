import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <ng-content></ng-content>
      </table>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      table {
        width: 100%;
        border-spacing: 0;
      }
      thead {
        background-color: #f8fafc; /* bg-slate-50 */
        border-bottom: 1px solid #e2e8f0; /* border-slate-200 */
      }
      th {
        padding: 0.75rem 1rem;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748b; /* text-slate-500 */
      }
      tr {
        border-bottom: 1px solid #f1f5f9; /* border-slate-100 */
        transition: background-color 150ms;
      }
      tr:hover {
        background-color: #f8fafc; /* bg-slate-50 */
      }
      td {
        padding: 0.875rem 1rem;
        font-size: 0.875rem;
        color: #334155; /* text-slate-700 */
        vertical-align: middle;
      }
    }
  `]
})
export class TableComponent {}
