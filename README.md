# THORChain Indexer

A generic indexer for THORChain that processes transactions based on configurable YAML templates.

## Features

- Transaction processing based on YAML templates
- Support for multiple addresses and memo prefixes
- Dynamic table creation in the database
- Extensible parser system
- Indexing state tracking per address
- Automatic periodic execution
- Database migrations support
- Web-based database management interface (pgAdmin)

## Requirements

- Node.js >= 14
- PostgreSQL (or compatible)
- TypeScript
- Docker and Docker Compose (optional, for database only)

## Installation

### Option 1: Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/thorchain-indexer.git
cd thorchain-indexer
```

2. Install dependencies:
```bash
npm install
```

3. Start the PostgreSQL database and pgAdmin using Docker:
```bash
docker-compose up -d
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials (use the Docker PostgreSQL credentials)
```

5. Build the project:
```bash
npm run build
```

6. Run database migrations:
```bash
npm run migration:run
```

### Option 2: Full Docker Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/thorchain-indexer.git
cd thorchain-indexer
```

2. Start all services:
```bash
docker-compose up -d
```

This will:
- Start a PostgreSQL database
- Build and start the indexer
- Mount the templates directory for easy updates
- Set up automatic restart on failure
- Start pgAdmin web interface

## Database Management with pgAdmin

1. Access pgAdmin at http://localhost:5050
2. Login with:
   - Email: admin@admin.com
   - Password: admin
3. Add a new server:
   - Name: Thorchain Indexer
   - Host: postgres
   - Port: 5432
   - Database: thorchain_indexer
   - Username: postgres
   - Password: postgres

## Database Migrations

### Development

When you add or modify templates, you'll need to generate and run migrations:

1. Generate migrations from templates:
```bash
npm run migration:generate-templates
```

2. Run the migrations:
```bash
npm run migration:run
```

3. If you need to revert a migration:
```bash
npm run migration:revert
```

### Production Deployment

1. Before deploying, ensure all migrations are committed to version control
2. Run migrations as part of your deployment process:
```bash
npm run migration:run
```

3. If something goes wrong, you can revert the last migration:
```bash
npm run migration:revert
```

## Usage

### Local Development Usage

1. Create YAML templates in the `src/templates/` folder
2. Generate and run migrations if you've modified templates
3. Run the indexer locally:
```bash
npm start
```

4. View database logs (if needed):
```bash
docker-compose logs -f postgres
```

5. Stop the database:
```bash
docker-compose down
```

### Full Docker Usage

1. Create or modify YAML templates in the `src/templates/` folder
2. The indexer will automatically pick up changes to templates
3. View logs:
```bash
docker-compose logs -f indexer
```

4. Stop the services:
```bash
docker-compose down
```

## Template Structure

Each YAML template must have the following structure:

```yaml
address: "thor1..."  # Address to monitor
prefix: ["TB:"]     # Memo prefixes to process
table: "my_table"   # Table name to store data
columns:            # Table schema
  field1: "string"
  field2: "int"
  field3: "timestamp"
parser: "parserName"  # Parser function to use
```

## Creating Parsers

Parsers are defined in `src/parsers.ts`. Each parser must:

1. Receive a Midgard action
2. Extract relevant data from the memo
3. Return an object with the fields defined in the template

Parser example:

```typescript
export const parsers = {
  myParser: (action: MidgardAction): ParserResult => {
    const memo = action.metadata.send.memo;
    // Process the memo...
    return {
      field1: "value1",
      field2: 123,
      field3: new Date(),
    };
  },
};
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 