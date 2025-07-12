import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const ProfilePage = () => {
  const { user, updateProfile, fetchUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    skillsOffered: "",
    skillsWanted: "",
    availability: "Flexible",
    isPublic: true,
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        location: user.location || "",
        skillsOffered: user.skillsOffered?.join(", ") || "",
        skillsWanted: user.skillsWanted?.join(", ") || "",
        availability: user.availability || "Flexible",
        isPublic: user.isPublic !== undefined ? user.isPublic : true,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const profileData = {
      ...formData,
      skillsOffered: formData.skillsOffered
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill),
      skillsWanted: formData.skillsWanted
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill),
    };

    const result = await updateProfile(profileData);

    if (result.success) {
      setSuccess("Profile updated successfully!");
      await fetchUser();
    } else {
      setError(result.error || "Failed to update profile");
    }

    setLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    setError("");

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await axios.post("/api/users/profile/photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchUser();
      setSuccess("Profile photo updated successfully!");
    } catch (error) {
      setError("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (!user) return null;

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">My Profile</h2>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <div className="text-center mb-4">
                <img
                  src={user.profilePhoto || "https://via.placeholder.com/150"}
                  alt="Profile"
                  className="profile-photo-large mb-3"
                />
                <div>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="d-none"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload">
                    <Button
                      as="span"
                      variant="outline-primary"
                      disabled={uploadingPhoto}
                      style={{ cursor: "pointer" }}
                    >
                      {uploadingPhoto ? "Uploading..." : "Change Photo"}
                    </Button>
                  </label>
                </div>
              </div>

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Location</Form.Label>
                      <Form.Control
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="City, Country"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Skills Offered (comma-separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="skillsOffered"
                    value={formData.skillsOffered}
                    onChange={handleChange}
                    placeholder="e.g., JavaScript, Python, Guitar"
                  />
                  <Form.Text className="text-muted">
                    Enter the skills you can teach others
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Skills Wanted (comma-separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="skillsWanted"
                    value={formData.skillsWanted}
                    onChange={handleChange}
                    placeholder="e.g., Spanish, Photography, Cooking"
                  />
                  <Form.Text className="text-muted">
                    Enter the skills you want to learn
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Availability</Form.Label>
                  <Form.Select
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                  >
                    <option value="Weekends">Weekends</option>
                    <option value="Evenings">Evenings</option>
                    <option value="Mornings">Mornings</option>
                    <option value="Flexible">Flexible</option>
                    <option value="Not Available">Not Available</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="isPublic"
                    label="Make my profile public"
                    checked={formData.isPublic}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">
                    If unchecked, your profile won't appear in search results
                  </Form.Text>
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage;
