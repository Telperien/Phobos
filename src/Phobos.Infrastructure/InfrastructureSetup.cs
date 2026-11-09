using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Phobos.Application;
using Phobos.Infrastructure.Media;
using Phobos.Infrastructure.Persistence;
using Phobos.Infrastructure.Seed;

namespace Phobos.Infrastructure;

public static class InfrastructureSetup
{
    public static IServiceCollection AddPhobosInfrastructure(
        this IServiceCollection services, IConfiguration configuration, string contentRootPath)
    {
        var connectionString = configuration.GetConnectionString("Phobos")
            ?? throw new InvalidOperationException("ConnectionStrings:Phobos is missing.");
        var mediaRoot = Path.Combine(contentRootPath, configuration["Media:RootPath"] ?? "media");

        services.AddDbContext<PhobosDbContext>(options => options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention());
        services.AddScoped<IPhobiaCatalogue, EfPhobiaCatalogue>();
        services.AddSingleton<IRandomIndex, SharedRandomIndex>();
        services.AddSingleton<IMediaStore>(new LocalDiskMediaStore(mediaRoot));
        return services;
    }

    /// <summary>Applies migrations and loads the shipped catalogue into an empty database, when configured to.</summary>
    public static async Task PrepareDatabaseAsync(this IServiceProvider services, IConfiguration configuration)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<PhobosDbContext>();

        if (IsEnabled(configuration, "Database:MigrateOnStartup")) await db.Database.MigrateAsync();
        if (!IsEnabled(configuration, "Database:SeedOnStartup") || await db.Phobias.AnyAsync()) return;

        db.Phobias.AddRange(PhobiaSeed.LoadShipped());
        await db.SaveChangesAsync();
    }

    private static bool IsEnabled(IConfiguration configuration, string key) =>
        bool.TryParse(configuration[key], out var enabled) && enabled;
}
