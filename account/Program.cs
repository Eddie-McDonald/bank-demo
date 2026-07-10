using Npgsql;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
var dbPort = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "accountdb";
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "accountdb";
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "accountdb";

var connectionString =
    $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword}";

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapGet("/accounts/{username}/balance", async (string username) =>
{
    await using var conn = new NpgsqlConnection(connectionString);
    await conn.OpenAsync();

    await using var cmd = new NpgsqlCommand(
        "SELECT balance FROM accounts WHERE username = @username", conn);
    cmd.Parameters.AddWithValue("username", username);

    await using var reader = await cmd.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
        var balance = reader.GetDecimal(0);
        return Results.Ok(new { username, balance });
    }

    return Results.NotFound(new { message = "Account not found" });
});

app.Run();
