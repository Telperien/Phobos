using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Phobos.Infrastructure.Persistence;

namespace Phobos.Api.Tests;

/// <summary>
/// Runs the API against a throwaway PostgreSQL database, migrated and seeded with the shipped catalogue,
/// and a throwaway media folder. Set PHOBOS_TEST_DB to point at another server.
/// </summary>
public sealed class PhobosApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private const string DefaultServer = "Host=localhost;Port=5432;Username=phobos;Password=phobos_dev";

    private readonly string _connectionString = new NpgsqlConnectionStringBuilder(
        Environment.GetEnvironmentVariable("PHOBOS_TEST_DB") ?? DefaultServer)
    {
        Database = "phobos_test_" + Guid.NewGuid().ToString("N"),
    }.ConnectionString;

    public string MediaRoot { get; } = Path.Combine(Path.GetTempPath(), "phobos-api-media-" + Guid.NewGuid().ToString("N"));

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Directory.CreateDirectory(MediaRoot);
        builder.UseSetting("ConnectionStrings:Phobos", _connectionString);
        builder.UseSetting("Database:MigrateOnStartup", "true");
        builder.UseSetting("Database:SeedOnStartup", "true");
        builder.UseSetting("Media:RootPath", MediaRoot);
    }

    public async Task WithDatabaseAsync(Func<PhobosDbContext, Task> action)
    {
        await using var scope = Services.CreateAsyncScope();
        await action(scope.ServiceProvider.GetRequiredService<PhobosDbContext>());
    }

    public Task InitializeAsync() => Task.CompletedTask;

    async Task IAsyncLifetime.DisposeAsync()
    {
        await WithDatabaseAsync(db => db.Database.EnsureDeletedAsync());
        await DisposeAsync();
        Directory.Delete(MediaRoot, recursive: true);
    }
}
