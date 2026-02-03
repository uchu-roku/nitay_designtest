/**
 * Table Component
 * 
 * Professional data table with sorting, selection, and actions
 * 
 * Usage:
 * <Table>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>名前</TableHead>
 *       <TableHead>値</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>データ1</TableCell>
 *       <TableCell>100</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 */

import React from 'react';
import './Table.css';

export function Table({ children, className = '', ...props }) {
  return (
    <div className="table-wrapper">
      <table className={`data-table ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }) {
  return <thead className="data-table__header">{children}</thead>;
}

export function TableBody({ children }) {
  return <tbody className="data-table__body">{children}</tbody>;
}

export function TableRow({ children, selected = false, onClick, className = '' }) {
  return (
    <tr
      className={`data-table__row ${selected ? 'data-table__row--selected' : ''} ${
        onClick ? 'data-table__row--clickable' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, sortable = false, sorted, onSort, className = '' }) {
  return (
    <th
      className={`data-table__head ${sortable ? 'data-table__head--sortable' : ''} ${className}`}
      onClick={sortable ? onSort : undefined}
    >
      <div className="data-table__head-content">
        {children}
        {sortable && sorted && (
          <span className="data-table__sort-indicator">
            {sorted === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
}

export function TableCell({ children, align = 'left', mono = false, className = '' }) {
  return (
    <td
      className={`data-table__cell ${mono ? 'data-table__cell--mono' : ''} ${className}`}
      style={{ textAlign: align }}
    >
      {children}
    </td>
  );
}
