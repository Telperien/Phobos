using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;

namespace Phobos.Api.Tests;

/// <summary>Requests reach the app from an internal address, as they do from the App Service front end.</summary>
public sealed class FromInternalNetwork : IStartupFilter
{
    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) => app =>
    {
        app.Use((context, call) =>
        {
            context.Connection.RemoteIpAddress = IPAddress.Parse("10.0.0.7");
            return call(context);
        });
        next(app);
    };
}
