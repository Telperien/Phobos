namespace Phobos.Domain;

public enum Language { Fr, En, Es, De, It }

public static class Languages
{
    public static IReadOnlyList<Language> All { get; } = Enum.GetValues<Language>();

    /// <summary>The language used when a translation is missing.</summary>
    public const Language Fallback = Language.En;

    public static string Code(Language language) => language.ToString().ToLowerInvariant();

    public static bool TryParse(string? code, out Language language)
    {
        foreach (var candidate in All)
        {
            if (!string.Equals(Code(candidate), code, StringComparison.OrdinalIgnoreCase)) continue;
            language = candidate;
            return true;
        }

        language = default;
        return false;
    }
}
