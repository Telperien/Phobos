using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Phobos.Application;
using Phobos.Infrastructure.Content;
using Phobos.Infrastructure.Media;

namespace Phobos.Infrastructure;

public static class InfrastructureSetup
{
    /// <summary>Loads the shipped case files (a mistake in them stops the startup) and the image folder.</summary>
    public static IServiceCollection AddPhobosInfrastructure(
        this IServiceCollection services, IConfiguration configuration, string contentRootPath)
    {
        var mediaRoot = Path.Combine(contentRootPath, configuration["Media:RootPath"] ?? "media");

        services.AddSingleton<IPhobiaCatalogue>(new ContentPhobiaCatalogue(PhobiaContent.LoadShipped()));
        services.AddSingleton<IRandomIndex, SharedRandomIndex>();
        services.AddSingleton<IMediaStore>(new LocalDiskMediaStore(mediaRoot));
        return services;
    }
}
