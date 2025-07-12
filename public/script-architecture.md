
```mermaid
flowchart TD
    A[main()] --> B[fetecResultFormatted()]
    B --> C[getRowData()]
    C --> D[getGridOptions()]
    D --> E[create ag-Grid instance]
    E --> F[renderDateButtons()]