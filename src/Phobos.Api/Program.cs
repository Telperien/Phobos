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

app.MapOpenApi();
app.MapGet("/api/health", () => new { Status = "ok" });
app.MapPhobiaEndpoints();

await app.RunAsync();
