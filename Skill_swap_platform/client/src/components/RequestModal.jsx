import React, { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";

const RequestModal = ({ show, onHide, targetUser, currentUser }) => {
  const [formData, setFormData] = useState({
    skillOffered: "",
    skillWanted: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post("/api/requests", {
        toUser: targetUser._id,
        skillOffered: formData.skillOffered,
        skillWanted: formData.skillWanted,
        message: formData.message,
      });

      toast.success("Request sent successfully!");
      onHide();
      setFormData({ skillOffered: "", skillWanted: "", message: "" });
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Send Skill Swap Request</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Select Your Skill to Offer</Form.Label>
            <Form.Select
              value={formData.skillOffered}
              onChange={(e) =>
                setFormData({ ...formData, skillOffered: e.target.value })
              }
              required
            >
              <option value="">Choose a skill...</option>
              {currentUser?.skillsOffered?.map((skill, index) => (
                <option key={index} value={skill}>
                  {skill}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Select Skill You Want</Form.Label>
            <Form.Select
              value={formData.skillWanted}
              onChange={(e) =>
                setFormData({ ...formData, skillWanted: e.target.value })
              }
              required
            >
              <option value="">Choose a skill...</option>
              {targetUser?.skillsOffered?.map((skill, index) => (
                <option key={index} value={skill}>
                  {skill}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Message (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="Add a personal message..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Request"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default RequestModal;
