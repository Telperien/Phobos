using System.Net;
using System.Text;

namespace Phobos.Api.Site;

/// <summary>What a page says about itself: in its head, in search results and in link previews.</summary>
/// <param name="Path">Path of the page without its query, used for the canonical and language links.</param>
public sealed record PageHead(string Lang, string Title, string Description, string Path, Uri Image, bool Indexable);

public static class HeadHtml
{
    private const string Start = "<!-- head:start";
    private const string End = "<!-- head:end -->";

    /// <summary>Absolute address of a site path.</summary>
    public static string Absolute(Uri baseUrl, string path) => baseUrl.ToString().TrimEnd('/') + path;

    public static string Render(PageHead head, string locale, Uri baseUrl, IReadOnlyList<string> langs)
    {
        var canonical = Absolute(baseUrl, head.Path);
        var rest = head.Path[(1 + head.Lang.Length)..];
        var html = new StringBuilder()
            .AppendLine("<title>" + Encode(head.Title) + "</title>")
            .AppendLine(Meta("name", "description", head.Description));
        if (!head.Indexable) html.AppendLine(Meta("name", "robots", "noindex"));
        html.AppendLine(Link("canonical", null, canonical));
        foreach (var lang in langs) html.AppendLine(Link("alternate", lang, Absolute(baseUrl, $"/{lang}{rest}")));
        return html
            .AppendLine(Link("alternate", "x-default", Absolute(baseUrl, $"/en{rest}")))
            .AppendLine(Meta("property", "og:type", "website"))
            .AppendLine(Meta("property", "og:site_name", "Phobos"))
            .AppendLine(Meta("property", "og:locale", locale))
            .AppendLine(Meta("property", "og:title", head.Title))
            .AppendLine(Meta("property", "og:description", head.Description))
            .AppendLine(Meta("property", "og:url", canonical))
            .AppendLine(Meta("property", "og:image", head.Image.ToString()))
            .Append(Meta("name", "twitter:card", "summary_large_image"))
            .ToString();
    }

    /// <summary>Puts the head between the markers of the built index.html; a page without markers is left as is.</summary>
    public static string Inject(string page, string head, string lang)
    {
        var start = page.IndexOf(Start, StringComparison.Ordinal);
        var end = page.IndexOf(End, StringComparison.Ordinal);
        if (start < 0 || end < start) return page;
        var before = page[..start].Replace("<html lang=\"fr\">", $"<html lang=\"{lang}\">", StringComparison.Ordinal);
        return before + head + page[(end + End.Length)..];
    }

    private static string Encode(string text) => WebUtility.HtmlEncode(text);

    private static string Meta(string kind, string key, string content) =>
        $"<meta {kind}=\"{key}\" content=\"{Encode(content)}\" />";

    private static string Link(string rel, string? lang, string href) =>
        lang is null
            ? $"<link rel=\"{rel}\" href=\"{Encode(href)}\" />"
            : $"<link rel=\"{rel}\" hreflang=\"{lang}\" href=\"{Encode(href)}\" />";
}
