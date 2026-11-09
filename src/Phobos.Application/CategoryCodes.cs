using Phobos.Domain;

namespace Phobos.Application;

/// <summary>URL-friendly codes for categories (used in the API and in front-end routes).</summary>
public static class CategoryCodes
{
    private static readonly Dictionary<Category, string> Codes = new()
    {
        [Category.Animals] = "animals",
        [Category.NatureAndSpaces] = "nature-and-spaces",
        [Category.BodyAndHealth] = "body-and-health",
        [Category.Strange] = "strange",
    };

    public static string Code(Category category) => Codes[category];

    public static bool TryParse(string? code, out Category category)
    {
        foreach (var (candidate, candidateCode) in Codes)
        {
            if (candidateCode != code) continue;
            category = candidate;
            return true;
        }

        category = default;
        return false;
    }
}
