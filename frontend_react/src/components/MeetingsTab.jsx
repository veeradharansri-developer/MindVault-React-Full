import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { transcribeMeeting, listMeetings, getTeams } from "../api";
import { cardStyle, buttonStyle, inputStyle, themeColors, typography, sectionLabelStyle, pillStyle } from "../styles";
import EmptyState from "./EmptyState";
import { Mic } from "lucide-react";

export default function MeetingsTab({ apiKey, selectedTeam, onUploadSuccess }) {
  const [meetings, setMeetings] = useState([]);
  const [teams, setTeams] = useState(["General"]);
  const [targetTeam, setTargetTeam] = useState("General");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // File upload state
  const [audioFile, setAudioFile] = useState(null);
  
  // Live recording state
  const [recording, setRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const timerRef = useRef(null);

  // Selected meeting detail state
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const meetData = await listMeetings();
      setMeetings(meetData);
      
      const teamsData = await getTeams();
      setTeams(teamsData.map(t => t.name || t));
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Failed to load meetings list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Media Recording triggers
  const startRecording = async () => {
    setError("");
    setAudioChunks([]);
    setRecordingTimer(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((prev) => [...prev, e.data]);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250); // Capture chunk every 250ms
      setMediaRecorder(recorder);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTimer((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Microphone access denied or audio input device not found.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Transcribe recorded audio chunks
  const handleTranscribeRecorded = async () => {
    if (audioChunks.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const mimeType = mediaRecorder?.mimeType || "audio/webm";
      const cleanMime = mimeType.split(";")[0];
      let ext = cleanMime.split("/")[1] || "webm";
      // Handle chrome x-matroska wrapper fallback
      if (ext.includes("webm") || ext.includes("matroska")) {
        ext = "webm";
      }
      
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      const file = new File([audioBlob], `recorded_meeting_${Date.now()}.${ext}`, { type: mimeType });
      
      const data = await transcribeMeeting(file, targetTeam, apiKey);
      setAudioChunks([]);
      loadData();
      if (onUploadSuccess) onUploadSuccess();
      setSelectedMeeting(data);
      alert("✓ Transcription complete! Meeting loaded in vector index.");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to transcribe audio.");
    } finally {
      setLoading(false);
    }
  };

  // Upload external audio
  const handleUploadAudio = async (e) => {
    e.preventDefault();
    if (!audioFile) return;
    setLoading(true);
    setError("");
    try {
      const data = await transcribeMeeting(audioFile, targetTeam, apiKey);
      setAudioFile(null);
      // Reset file input element
      e.target.reset();
      loadData();
      if (onUploadSuccess) onUploadSuccess();
      setSelectedMeeting(data);
      alert("✓ Meeting uploaded and transcribed successfully!");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to transcribe audio file.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 1. Capture Panel */}
      <div style={cardStyle}>
        <div
          style={{
            fontFamily: typography.mono.fontFamily,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: themeColors.highlightAmber,
            marginBottom: "0.25rem",
          }}
        >
          VOICE CAPTURE
        </div>
        <h2 style={{ ...typography.heading, fontSize: "1.6rem", marginTop: 0, marginBottom: "1rem" }}>
          Meeting Transcription & Indexer
        </h2>
        <p style={{ color: themeColors.textSecondary, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
          Record live discussions or upload meeting recordings. Speech is transcribed using Groq Whisper, structured into action plans, and automatically indexed in the vector store.
        </p>

        {error && (
          <div style={{ color: themeColors.confidenceLow, padding: "1rem", border: `1px solid ${themeColors.confidenceLow}33`, borderRadius: "8px", background: "rgba(239, 91, 91, 0.05)", marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        {/* Configuration team context for meeting */}
        <div style={{ marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.4rem", maxWidth: "300px" }}>
          <label style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: themeColors.textSecondary }}>
            Assign Meeting Documents to Team
          </label>
          <select
            value={targetTeam}
            onChange={(e) => setTargetTeam(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              background: "#1A1A1A",
              color: themeColors.textPrimary,
              border: `1px solid ${themeColors.borderDivider}`,
              outline: "none",
            }}
          >
            {teams.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
          {/* Option A: Live Mic Recording */}
          <div style={{ flex: "1 1 300px", paddingRight: "2.5rem" }}>
            <h4 style={sectionLabelStyle}>Option A: Live Recording</h4>
            
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", background: "#1A1A1A", borderRadius: "12px", border: `1px solid ${themeColors.borderDivider}` }}>
              {recording ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      backgroundColor: "#ef4444",
                      animation: "pulse 1s infinite alternate"
                    }}
                  />
                  <span style={{ fontSize: "1.5rem", fontWeight: "bold", fontFamily: typography.mono.fontFamily }}>
                    {formatTimer(recordingTimer)}
                  </span>
                  <button
                    onClick={stopRecording}
                    style={{
                      ...buttonStyle,
                      background: "#ef4444",
                      marginTop: "0.5rem"
                    }}
                  >
                    Stop Recording
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "2rem" }}>🎙️</span>
                  {audioChunks.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", color: themeColors.confidenceHigh }}>Recording Captured Successfully</span>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={startRecording}
                          style={{
                            ...buttonStyle,
                            marginTop: 0,
                            padding: "0.4rem 0.8rem",
                            background: "rgba(255,255,255,0.05)",
                            border: `1px solid ${themeColors.borderDivider}`,
                            color: themeColors.textPrimary
                          }}
                        >
                          Record Again
                        </button>
                        <button
                          onClick={handleTranscribeRecorded}
                          disabled={loading}
                          style={{
                            ...buttonStyle,
                            marginTop: 0,
                            padding: "0.4rem 1rem",
                            background: themeColors.highlightAmber,
                            color: themeColors.bgBase
                          }}
                        >
                          {loading ? "Transcribing..." : "Transcribe Now"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={startRecording}
                      disabled={loading}
                      style={{
                        ...buttonStyle,
                        marginTop: 0,
                        backgroundColor: themeColors.accentPrimary
                      }}
                    >
                      Start Live Capture
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Option B: Audio File Upload */}
          <div style={{ flex: "1 1 300px", borderLeft: `1px solid ${themeColors.borderDivider}`, paddingLeft: "2.5rem" }}>
            <h4 style={sectionLabelStyle}>Option B: Audio File Upload</h4>
            <form onSubmit={handleUploadAudio} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                style={{
                  ...inputStyle,
                  padding: "0.5rem",
                  background: "#1A1A1A",
                  border: `1px solid ${themeColors.borderDivider}`
                }}
                required
              />
              <span style={{ fontSize: "0.75rem", color: themeColors.textSecondary }}>
                Supports MP3, WAV, M4A, WEBM, MPEG (Max 25MB).
              </span>
              <button
                type="submit"
                disabled={loading || !audioFile}
                style={{
                  ...buttonStyle,
                  marginTop: "0.5rem"
                }}
              >
                {loading ? "Uploading & Transcribing..." : "Upload & Index Meeting"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 2. Details Card (Show active selection details) */}
      {selectedMeeting && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ ...typography.heading, fontSize: "1.4rem", margin: 0 }}>
              Structured Notes: {selectedMeeting.filename || "Meeting Details"}
            </h3>
            <button
              onClick={() => setSelectedMeeting(null)}
              style={{
                background: "transparent",
                border: "none",
                color: themeColors.textSecondary,
                fontSize: "1.2rem",
                cursor: "pointer"
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <div style={{ ...sectionLabelStyle, color: themeColors.highlightAmber }}>Key Discussion Points</div>
              <ul style={{ color: themeColors.textPrimary, margin: 0, paddingLeft: "1.25rem", lineHeight: 1.5 }}>
                {selectedMeeting.key_points.map((p, idx) => (
                  <li key={idx} style={{ marginBottom: "0.25rem" }}>{p}</li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{ ...sectionLabelStyle, color: themeColors.accentPrimary }}>Critical Decisions Made</div>
              <ul style={{ color: themeColors.textPrimary, margin: 0, paddingLeft: "1.25rem", lineHeight: 1.5 }}>
                {selectedMeeting.decisions.map((d, idx) => (
                  <li key={idx} style={{ marginBottom: "0.25rem" }}>{d}</li>
                ))}
              </ul>
            </div>

            <div>
              <div style={{ ...sectionLabelStyle, color: themeColors.confidenceHigh }}>Action Items & Assignments</div>
              <ul style={{ color: themeColors.textPrimary, margin: 0, paddingLeft: "1.25rem", lineHeight: 1.5 }}>
                {selectedMeeting.action_items.map((a, idx) => (
                  <li key={idx} style={{ marginBottom: "0.25rem" }}>{a}</li>
                ))}
              </ul>
            </div>

            {selectedMeeting.transcript && (
              <details style={{ borderTop: `1px solid ${themeColors.borderDivider}`, paddingTop: "1rem", marginTop: "0.5rem" }}>
                <summary style={{ color: themeColors.textSecondary, fontSize: "0.85rem", cursor: "pointer", fontWeight: 600, outline: "none" }}>
                  View Raw Meeting Transcript
                </summary>
                <p
                  style={{
                    color: themeColors.textSecondary,
                    fontSize: "0.85rem",
                    lineHeight: 1.5,
                    background: "#1A1A1A",
                    padding: "1rem",
                    borderRadius: "8px",
                    marginTop: "0.5rem",
                    whiteSpace: "pre-wrap",
                    maxHeight: "200px",
                    overflowY: "auto"
                  }}
                >
                  {selectedMeeting.transcript}
                </p>
              </details>
            )}
          </div>
        </div>
      )}

      {/* 3. History List */}
      <div style={cardStyle}>
        <h3 style={{ ...typography.heading, fontSize: "1.3rem", marginTop: 0, marginBottom: "0.5rem" }}>
          Meeting Document History
        </h3>
        <p style={{ color: themeColors.textSecondary, fontSize: "0.85rem", margin: "0 0 1.25rem 0" }}>
          List of meeting notes index logs loaded in vector search profiles.
        </p>

        {loading && meetings.length === 0 ? (
          <p style={{ color: themeColors.textSecondary, fontStyle: "italic" }}>Loading history...</p>
        ) : meetings.length === 0 ? (
          <EmptyState
            icon={Mic}
            title="No meeting recordings indexed yet"
            description="Record or upload audio meetings to transcribe and extract action tasks."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "350px", overflowY: "auto" }}>
            {meetings.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMeeting(m)}
                style={{
                  background: "#1A1A1A",
                  border: `1px solid ${selectedMeeting?.id === m.id ? themeColors.highlightAmber : themeColors.borderDivider}`,
                  borderRadius: "8px",
                  padding: "0.8rem 1rem",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "border-color 0.2s"
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: themeColors.textPrimary }}>🎙️ {m.filename}</div>
                  <div style={{ fontSize: "0.8rem", color: themeColors.textSecondary, marginTop: "0.25rem" }}>
                    Team: <code style={{ fontFamily: typography.mono.fontFamily }}>{m.team_id || "General"}</code> | Date: {m.created_at}
                  </div>
                </div>
                <span style={{ fontSize: "0.75rem", color: themeColors.highlightAmber, fontWeight: 600 }}>
                  View Structured Notes ➔
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
