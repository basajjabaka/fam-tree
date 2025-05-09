import { useState, useEffect } from "react";
import { ChevronDown, Globe, Volume2 } from "lucide-react";

function FamilyHistory() {
  // History content in both languages
  const historyContent = {
    en: `The Malieakkal Anchery Family boasts a rich legacy spanning generations. From humble beginnings to becoming a pillar of the community, their journey is marked by resilience, unity, and cherished traditions.`,
    ml: `മാളിയേക്കൽ അഞ്ഞേരി കുടുംബം പല തലമുറകളിലൂടെയും പടർന്നിരിക്കുന്ന സമൃദ്ധമായ പൈതൃകമാണ്. ചെറിയ തുടക്കങ്ങളില്‍ നിന്ന് സമൂഹത്തിന്റെ ഒരു അടിത്തറയാവുന്നതുവരെ, അവരുടെ യാത്ര സ്ഥിരത, ഐക്യം, ആഴത്തിലുള്ള പാരമ്പര്യങ്ങളാൽ അടയാളപ്പെടുത്തിയതാണ്.`,
  };

  const [language, setLanguage] = useState("en");
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const viteapibaseurl = import.meta.env.VITE_API_BASE_URL;

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        URL.revokeObjectURL(currentAudio.src);
      }
    };
  }, [currentAudio]);

  const speakText = async () => {
    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        URL.revokeObjectURL(currentAudio.src);
        setCurrentAudio(null);
      }

      const response = await fetch(`${viteapibaseurl}/api/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: historyContent[language],
          languageCode: language === "ml" ? "ml-IN" : "en-US",
        }),
      });

      if (!response.ok) throw new Error("TTS request failed");

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const newAudio = new Audio(url);

      // Set up audio event handlers
      newAudio.onended = () => {
        URL.revokeObjectURL(url);
        setCurrentAudio(null);
      };

      newAudio.onerror = (error) => {
        console.error("Audio playback error:", error);
        URL.revokeObjectURL(url);
        setCurrentAudio(null);
      };

      setCurrentAudio(newAudio);
      newAudio.play().catch((error) => {
        console.error("Playback failed:", error);
        URL.revokeObjectURL(url);
        setCurrentAudio(null);
      });
    } catch (error) {
      console.error("TTS Error:", error);
      if (currentAudio) {
        currentAudio.pause();
        URL.revokeObjectURL(currentAudio.src);
        setCurrentAudio(null);
      }
    }
  };

  const handleLanguageChange = () => {
    if (currentAudio) {
      currentAudio.pause();
      URL.revokeObjectURL(currentAudio.src);
      setCurrentAudio(null);
    }
    setLanguage((lang) => (lang === "en" ? "ml" : "en"));
  };

  return (
    <section className="history-card">
      <div
        className="history-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="header-content">
          <h3>{language === "en" ? "Family History" : "കുടുംബ ചരിത്രം"}</h3>
          <ChevronDown
            className={`chevron ${isExpanded ? "expanded" : ""}`}
            size={20}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="history-content">
          <div className="controls">
            <button className="language-toggle" onClick={handleLanguageChange}>
              <Globe size={16} />
              {language === "en" ? "മലയാളം" : "English"}
            </button>

            <button
              className="tts-button"
              onClick={speakText}
              aria-label="Read aloud"
            >
              <Volume2 size={16} />
              {language === "en" ? "Listen" : "കേൾക്കുക"}
            </button>
          </div>

          <div className="text-container">
            <p>{historyContent[language]}</p>
          </div>
        </div>
      )}
    </section>
  );
}

export default FamilyHistory;
