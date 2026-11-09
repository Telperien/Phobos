using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Phobos.Domain;
using Phobos.Infrastructure.Persistence;

namespace Phobos.Infrastructure.Tests;

/// <summary>Runs against a throwaway PostgreSQL database. Set PHOBOS_TEST_DB to point at another server.</summary>
public sealed class DatabasePreparationTests : IAsyncLifetime
{
    private const string DefaultServer = "Host=localhost;Port=5432;Username=phobos;Password=phobos_dev";

    private readonly string _connectionString = new NpgsqlConnectionStringBuilder(
        Environment.GetEnvironmentVariable("PHOBOS_TEST_DB") ?? DefaultServer)
    {
        Database = "phobos_test_" + Guid.NewGuid().ToString("N"),
    }.ConnectionString;

    private ServiceProvider Services(string migrate, string seed) =>
        new ServiceCollection()
            .AddPhobosInfrastructure(Configuration(migrate, seed), Path.GetTempPath())
            .BuildServiceProvider();

    private IConfiguration Configuration(string migrate, string seed) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Phobos"] = _connectionString,
                ["Database:MigrateOnStartup"] = migrate,
                ["Database:SeedOnStartup"] = seed,
            })
            .Build();

    private async Task<int> PrepareAndCountAsync(string migrate, string seed)
    {
        await using var services = Services(migrate, seed);
        await services.PrepareDatabaseAsync(Configuration(migrate, seed));
        await using var scope = services.CreateAsyncScope();
        return await scope.ServiceProvider.GetRequiredService<PhobosDbContext>().Phobias.CountAsync();
    }

    [Fact]
    public async Task Migrates_and_loads_the_shipped_catalogue_into_an_empty_database()
    {
        Assert.Equal(30, await PrepareAndCountAsync(migrate: "true", seed: "true"));
    }

    [Fact]
    public async Task Does_not_load_the_catalogue_twice()
    {
        await PrepareAndCountAsync(migrate: "true", seed: "true");

        Assert.Equal(30, await PrepareAndCountAsync(migrate: "true", seed: "true"));
    }

    [Fact]
    public async Task Leaves_the_database_empty_when_seeding_is_off()
    {
        Assert.Equal(0, await PrepareAndCountAsync(migrate: "true", seed: "false"));
    }

    [Fact]
    public async Task Stores_languages_and_media_kinds_by_name_so_reordering_an_enum_cannot_corrupt_data()
    {
        await PrepareAndCountAsync(migrate: "true", seed: "true");
        await using var services = Services("false", "false");
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<PhobosDbContext>();
        var phobia = await db.Phobias.SingleAsync(candidate => candidate.Slug == "acrophobia");
        phobia.AddMedia(ExposureMedia.Image(1, "acrophobia/1-a.webp"));
        await db.SaveChangesAsync();

        var stored = await db.Database
            .SqlQuery<string>($"SELECT translations::text || media::text AS \"Value\" FROM phobias WHERE slug = 'acrophobia'")
            .SingleAsync();

        Assert.Contains("\"Language\": \"Fr\"", stored, StringComparison.Ordinal);
        Assert.Contains("\"Kind\": \"Image\"", stored, StringComparison.Ordinal);
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        await using var services = Services("false", "false");
        await using var scope = services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<PhobosDbContext>().Database.EnsureDeletedAsync();
    }
}
