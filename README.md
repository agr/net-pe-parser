# net-pe-parser

.NET PE executable parser to access the CLI metadata in TS/JS.
Mostly based on information in Part II of [ECMA-335](https://www.ecma-international.org/publications-and-standards/standards/ecma-335/).
Very early stages of development.

## Usage

```typescript
    const peFile = // obtain an ArrayBuffer with PE file content
    const cliFile = new CliFile(peFile);
    const metadataTables = cliFile.getCliMetadata();
```