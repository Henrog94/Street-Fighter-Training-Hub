import { useEffect, useState } from "react";
import "./FightLabProfile.css";

const TOKEN_KEY = "fightlab_demo_token";

export default function FightLabProfile({ onProfileUpdated }) {
  const [user, setUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const token = sessionStorage.getItem(TOKEN_KEY);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load profile.");
        setUser(data.user);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      });
    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    if (!selectedFile) {
      setPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setError("");
    setMessage("");
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      setSelectedFile(null);
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Your image must be smaller than 2 MB.");
      setSelectedFile(null);
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !token || loading) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("avatar", selectedFile);
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed.");
      setUser(data.user);
      setSelectedFile(null);
      setEditingAvatar(false);
      setMessage("Profile picture updated.");
      onProfileUpdated?.(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!token || loading || !user?.avatar) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/profile/avatar", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to remove picture.");
      const updatedUser = data.user || { ...user, avatar: "" };
      setUser(updatedUser);
      setSelectedFile(null);
      setEditingAvatar(false);
      setMessage("Profile picture removed.");
      onProfileUpdated?.(updatedUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;
  if (!user) {
    return <section className="fightlab-profile"><p>{error || "Loading profile..."}</p></section>;
  }

  const avatarSource = preview || user.avatar || "";

  return (
    <section className="fightlab-profile">
      <div className="fightlab-profile-heading">
        <span>PLAYER PROFILE</span>
        <span className="fightlab-profile-active">● ACTIVE</span>
      </div>

      <div className="fightlab-profile-details">
        {avatarSource ? (
          <img src={avatarSource} alt={`${user.username}'s profile`} className="fightlab-profile-avatar" />
        ) : (
          <div className="fightlab-profile-avatar fallback">{user.username?.charAt(0).toUpperCase() || "F"}</div>
        )}
        <div className="fightlab-profile-identity">
          <h2>{user.username}</h2>
          <small>FIGHTLAB TRAINING MEMBER</small>
        </div>
      </div>

      <div className="fightlab-profile-editbar">
        <button
          type="button"
          className="fightlab-profile-edit-toggle"
          aria-expanded={editingAvatar}
          aria-controls="fightlab-avatar-editor"
          onClick={() => {
            setEditingAvatar((open) => !open);
            setError("");
            setMessage("");
            setSelectedFile(null);
          }}
        >
          <span aria-hidden="true">✎</span> {editingAvatar ? "CLOSE PICTURE EDITOR" : "EDIT PROFILE PICTURE"}
          <span aria-hidden="true">{editingAvatar ? "−" : "+"}</span>
        </button>
      </div>

      {editingAvatar && (
        <div id="fightlab-avatar-editor" className="fightlab-profile-upload">
          <label htmlFor="fightlab-avatar-input">CHOOSE A NEW PICTURE</label>
          <input
            id="fightlab-avatar-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
          <p className="fightlab-profile-hint">JPG, PNG, or WebP · Maximum 2 MB</p>
          {selectedFile && <p className="fightlab-selected-file">Selected: {selectedFile.name}</p>}
          <div className="fightlab-profile-actions">
            <button type="button" onClick={handleUpload} disabled={!selectedFile || loading}>
              {loading ? "PLEASE WAIT..." : "SAVE PICTURE"}
            </button>
            {user.avatar && (
              <button type="button" className="remove" onClick={handleRemove} disabled={loading}>
                REMOVE PICTURE
              </button>
            )}
          </div>
        </div>
      )}

      {message && <p className="fightlab-profile-success" role="status">{message}</p>}
      {error && <p className="fightlab-profile-error" role="alert">{error}</p>}
    </section>
  );
}
