"use client";

import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Button } from "@heroui/react";

export interface VoicePickerProps {
  /**
   * List of available voices
   */
  voices: VoiceOption[];

  /**
   * Currently selected voice ID
   */
  selectedVoice?: string;

  /**
   * Callback when voice is selected
   */
  onVoiceSelect?: (voiceId: string) => void;

  /**
   * Whether to show voice preview button
   * @default true
   */
  showPreview?: boolean;

  /**
   * Callback when preview is requested
   */
  onPreviewVoice?: (voiceId: string) => void;

  /**
   * Custom className for container
   */
  className?: string;

  /**
   * Display mode
   * @default "list"
   */
  displayMode?: "list" | "grid" | "dropdown";

  /**
   * Whether to show language flags
   * @default true
   */
  showLanguage?: boolean;

  /**
   * Whether to show voice characteristics
   * @default true
   */
  showCharacteristics?: boolean;

  /**
   * Maximum items to show before scroll
   * @default 5
   */
  maxVisibleItems?: number;
}

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  languageCode?: string;
  gender?: "male" | "female" | "neutral";
  age?: "young" | "adult" | "mature";
  accent?: string;
  description?: string;
  sample?: string;
}

export const VoicePicker: React.FC<VoicePickerProps> = ({
  voices = [],
  selectedVoice,
  onVoiceSelect,
  showPreview = true,
  onPreviewVoice,
  className = "",
  displayMode = "list",
  showLanguage = true,
  showCharacteristics = true,
  maxVisibleItems = 5,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  const handleVoiceSelect = (voiceId: string) => {
    onVoiceSelect?.(voiceId);
    if (displayMode === "dropdown") {
      setIsExpanded(false);
    }
  };

  const handlePreviewVoice = (voiceId: string) => {
    if (previewingVoice === voiceId) {
      setPreviewingVoice(null);
      return;
    }
    setPreviewingVoice(voiceId);
    onPreviewVoice?.(voiceId);
    
    // Simulate preview ending after 3 seconds
    setTimeout(() => {
      setPreviewingVoice(null);
    }, 3000);
  };

  const getLanguageFlag = (languageCode?: string) => {
    // Simple flag mapping - in production, use proper flag library
    const flags: Record<string, string> = {
      "en": "🇺🇸",
      "es": "🇪🇸", 
      "fr": "🇫🇷",
      "de": "🇩🇪",
      "it": "🇮🇹",
      "pt": "🇵🇹",
      "ja": "🇯🇵",
      "ko": "🇰🇷",
      "zh": "🇨🇳",
      "ar": "🇸🇦",
    };
    return flags[languageCode?.toLowerCase() || ""] || "🌐";
  };

  const getGenderIcon = (gender?: string) => {
    switch (gender) {
      case "male":
        return "♂️";
      case "female":
        return "♀️";
      default:
        return "⚧️";
    }
  };

  const filteredVoices = isExpanded ? voices : voices.slice(0, maxVisibleItems);
  const selectedVoiceData = voices.find(v => v.id === selectedVoice);

  if (displayMode === "dropdown") {
    return (
      <View className={`bg-background border-border border rounded-lg ${className}`}>
        {/* Selected voice display */}
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          className="flex-row items-center justify-between p-3"
        >
          <View className="flex-row items-center gap-2 flex-1">
            {selectedVoiceData && (
              <>
                {showLanguage && (
                  <Text>{getLanguageFlag(selectedVoiceData.languageCode)}</Text>
                )}
                <View className="flex-1">
                  <Text className="text-foreground font-medium">
                    {selectedVoiceData.name}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {selectedVoiceData.language}
                  </Text>
                </View>
              </>
            )}
            
            {!selectedVoiceData && (
              <Text className="text-muted-foreground">
                Select a voice...
              </Text>
            )}
          </View>
          
          <Text className="text-muted-foreground">
            {isExpanded ? "▲" : "▼"}
          </Text>
        </Pressable>

        {/* Dropdown options */}
        {isExpanded && (
          <View className="border-t border-border max-h-64">
            {voices.map((voice) => (
              <Pressable
                key={voice.id}
                onPress={() => handleVoiceSelect(voice.id)}
                className={`flex-row items-center justify-between p-3 border-t border-border/50 ${
                  selectedVoice === voice.id ? "bg-primary/10" : ""
                }`}
              >
                <View className="flex-row items-center gap-2 flex-1">
                  {showLanguage && (
                    <Text>{getLanguageFlag(voice.languageCode)}</Text>
                  )}
                  <View className="flex-1">
                    <Text className={`text-foreground ${
                      selectedVoice === voice.id ? "font-medium" : ""
                    }`}>
                      {voice.name}
                    </Text>
                    <Text className="text-muted-foreground text-sm">
                      {voice.language}
                    </Text>
                  </View>
                </View>

                {showPreview && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => handlePreviewVoice(voice.id)}
                    isDisabled={previewingVoice === voice.id}
                  >
                    <Text>
                      {previewingVoice === voice.id ? "🔊" : "▶️"}
                    </Text>
                  </Button>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  }

  if (displayMode === "grid") {
    return (
      <View className={`bg-background ${className}`}>
        <View className="flex-row flex-wrap gap-2">
          {voices.map((voice) => (
            <Button
              key={voice.id}
              variant={selectedVoice === voice.id ? "primary" : "secondary"}
              size="sm"
              onPress={() => handleVoiceSelect(voice.id)}
              className="min-w-[120px]"
            >
              <View className="flex-col items-center gap-1">
                {showLanguage && (
                  <Text>{getLanguageFlag(voice.languageCode)}</Text>
                )}
                <Text className="text-sm text-center">
                  {voice.name}
                </Text>
                
                {showCharacteristics && (
                  <View className="flex-row gap-1">
                    {showCharacteristics && voice.gender && (
                      <Text className="text-xs">{getGenderIcon(voice.gender)}</Text>
                    )}
                  </View>
                )}
              </View>
            </Button>
          ))}
        </View>
        
        {voices.length > maxVisibleItems && (
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setIsExpanded(!isExpanded)}
            className="mt-2"
          >
            <Text className="text-sm">
              {isExpanded ? "Show less" : `Show ${voices.length - maxVisibleItems} more`}
            </Text>
          </Button>
        )}
      </View>
    );
  }

  // List view (default)
  return (
    <View className={`bg-background ${className}`}>
      {filteredVoices.map((voice) => (
        <Pressable
          key={voice.id}
          onPress={() => handleVoiceSelect(voice.id)}
          className={`flex-row items-center justify-between p-3 border-b border-border/50 rounded-lg mb-2 ${
            selectedVoice === voice.id ? "bg-primary/10 border-primary/30" : "bg-muted/50"
          }`}
        >
          <View className="flex-row items-center gap-3 flex-1">
            {/* Language flag */}
            {showLanguage && (
              <Text className="text-lg">{getLanguageFlag(voice.languageCode)}</Text>
            )}

            {/* Voice info */}
            <View className="flex-1">
              <Text className={`text-foreground font-medium ${
                selectedVoice === voice.id ? "text-primary" : ""
              }`}>
                {voice.name}
              </Text>
              
              <Text className="text-muted-foreground text-sm">
                {voice.language}
              </Text>

              {/* Voice characteristics */}
              {showCharacteristics && (
                <View className="flex-row items-center gap-2 mt-1">
                  {voice.gender && (
                    <Text className="text-xs text-muted-foreground">
                      {getGenderIcon(voice.gender)} {voice.gender}
                    </Text>
                  )}
              
                  {voice.age && (
                    <Text className="text-xs text-muted-foreground">
                      {voice.age}
                    </Text>
                  )}
                  
                  {voice.accent && (
                    <Text className="text-xs text-muted-foreground">
                      {voice.accent}
                    </Text>
                  )}
                </View>
              )}

              {voice.description && (
                <Text className="text-muted-foreground text-xs mt-1">
                  {voice.description}
                </Text>
              )}
            </View>
          </View>

          {/* Preview button */}
          {showPreview && (
            <Button
              size="sm"
              variant="ghost"
              onPress={() => handlePreviewVoice(voice.id)}
              isDisabled={previewingVoice === voice.id}
            >
              <Text>
                {previewingVoice === voice.id ? "🔊" : "▶️"}
              </Text>
            </Button>
          )}
        </Pressable>
      ))}

      {/* Show more/less button */}
      {voices.length > maxVisibleItems && (
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setIsExpanded(!isExpanded)}
          className="justify-center"
        >
          <Text className="text-sm">
            {isExpanded ? "Show less" : `Show ${voices.length - maxVisibleItems} more voices`}
          </Text>
        </Button>
      )}
    </View>
  );
};

// Sample voices for testing
export const sampleVoices: VoiceOption[] = [
  {
    id: "rachel",
    name: "Rachel",
    language: "English (US)",
    languageCode: "en",
    gender: "female",
    age: "adult",
    description: "Natural, warm, and friendly"
  },
  {
    id: "domi", 
    name: "Domi",
    language: "English (US)",
    languageCode: "en",
    gender: "female",
    age: "young",
    description: "Energetic and youthful"
  },
  {
    id: "bella",
    name: "Bella", 
    language: "English (US)",
    languageCode: "en",
    gender: "female",
    age: "adult",
    description: "Professional and clear"
  },
  {
    id: "antoni",
    name: "Antoni",
    language: "English (US)", 
    languageCode: "en",
    gender: "male",
    age: "adult",
    description: "Deep and authoritative"
  },
  {
    id: "elli",
    name: "Elli",
    language: "English (UK)",
    languageCode: "en", 
    gender: "female",
    age: "adult",
    accent: "British",
    description: "Elegant British accent"
  },
  {
    id: "drew",
    name: "Drew",
    language: "English (Australia)",
    languageCode: "en",
    gender: "male", 
    age: "adult",
    accent: "Australian",
    description: "Casual Australian accent"
  },
];

// Default export
export default VoicePicker;