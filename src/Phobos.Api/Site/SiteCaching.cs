using Microsoft.AspNetCore.StaticFiles;

namespace Phobos.Api.Site;

/// <summary>How long browsers may keep what the site sends them.</summary>
public static class SiteCaching
{
    /// <summary>Built files under /assets: their name changes with their content, so they never go stale.</summary>
    public const string Asset = "public, max-age=31536000, immutable";

    /// <summary>Pages: checked again on each visit, so a new deployment shows at once.</summary>
    public const string Page = "no-cache";

    /// <summary>Case file images: replaced rarely, under the same name.</summary>
    public const string Image = "public, max-age=86400";

    public static void ForStaticFile(StaticFileResponseContext context)
    {
        if (context.Context.Request.Path.StartsWithSegments("/assets", StringComparison.Ordinal))
            context.Context.Response.Headers.CacheControl = Asset;
    }
}
