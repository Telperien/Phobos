using System.Text.Json.Serialization;
using Phobos.Api;
using Phobos.Application;
using Phobos.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddPhobosInfrastructure(builder.Configuration, builder.Environment.ContentRootPath);
builder.Services.AddScoped<PhobiaQueries>();
builder.Services.ConfigureHttpJsonOptions(options => options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict);
builder.Services.AddOpenApi();

var app = builder.Build();
await app.Services.PrepareDatabaseAsync(app.Configuration);

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapOpenApi();
app.MapGet("/api/health", () => new { Status = "ok" });
app.MapPhobiaEndpoints();

// The built site lives in wwwroot: any other page goes to index.html so the React router decides,
// except under /api where an unknown route must stay a 404.
app.MapFallback("/api/{**path}", () => Results.NotFound()).ExcludeFromDescription();
app.MapFallbackToFile("index.html");

await app.RunAsync();
