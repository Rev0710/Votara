import React from "react";
import { FiCheck, FiUpload, FiTrash2 } from "react-icons/fi";
import "./CandidatePhotoPreview.css";

export default function CandidatePhotoPreview({ src, onChange, onRemove, disabled = false }) {
    return (
        <div className="eb-candidate-image-preview eb-candidate-photo-preview">
            <img className="eb-candidate-photo-preview-image" src={src} alt="Candidate profile preview" />
            <div className="eb-candidate-photo-preview-content">
                <span className="eb-candidate-photo-ready" role="status">
                    <FiCheck aria-hidden="true" /> Photo ready
                </span>
                <strong className="eb-candidate-photo-preview-title">Candidate profile picture</strong>
                <p className="eb-candidate-photo-preview-description">This photo will appear on the candidate’s profile and ballot.</p>
                <div className="eb-candidate-photo-preview-actions">
                    <button type="button" onClick={onChange} disabled={disabled}>
                        <FiUpload aria-hidden="true" /> Change photo
                    </button>
                    <button type="button" className="eb-candidate-photo-remove" onClick={onRemove} disabled={disabled}>
                        <FiTrash2 aria-hidden="true" /> Remove
                    </button>
                </div>
            </div>
        </div>
    );
}
