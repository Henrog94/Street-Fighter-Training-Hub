
const DATA_URL =
  "https://api.github.com/repos/jeff502/Street-Fighter-6-Frame-Data-Discord-Bot/contents/character_json.json";

export async function fetchExternalFighterData() {
  const response = await fetch(DATA_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "FightLab-School-Project"
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(
      `External API returned HTTP ${response.status}`
    );
  }

  const file = await response.json();

  if (file.encoding !== "base64" || !file.content) {
    throw new Error("Unexpected GitHub API response");
  }

  const jsonText = Buffer.from(
    file.content.replace(/\s/g, ""),
    "base64"
  ).toString("utf8");

  return JSON.parse(jsonText);
}
