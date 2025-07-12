import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import RequestModal from "../components/RequestModal";
import axios from "axios";

const UserDetailPage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`/api/users/${id}`);
      setUser(response.data);
    } catch (error) {
      setError("User not found or profile is private");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setShowRequestModal(true);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Body>
              <div className="text-center mb-4">
                <img
                  src={user.profilePhoto || "https://via.placeholder.com/150"}
                  alt={user.name}
                  className="profile-photo-large mb-3"
                />
                <h2>{user.name}</h2>
                <p className="text-muted">
                  {user.location || "Location not specified"}
                </p>
                {user.rating > 0 && (
                  <div className="mb-3">
                    <span className="text-warning">★</span>{" "}
                    {user.rating.toFixed(1)} / 5.0
                    <small className="text-muted">
                      {" "}
                      ({user.totalRatings} ratings)
                    </small>
                  </div>
                )}
              </div>

              <Row className="mb-4">
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Body>
                      <h5>Skills Offered</h5>
                      <div>
                        {user.skillsOffered.map((skill, index) => (
                          <span key={index} className="skill-tag offered">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Body>
                      <h5>Skills Wanted</h5>
                      <div>
                        {user.skillsWanted.map((skill, index) => (
                          <span key={index} className="skill-tag wanted">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <div className="text-center mb-3">
                <p>
                  <strong>Availability:</strong> {user.availability}
                </p>
              </div>

              <div className="text-center">
                {currentUser && currentUser.id !== user._id && (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSendRequest}
                  >
                    Send Request
                  </Button>
                )}
                {!currentUser && (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate("/login")}
                  >
                    Login to Send Request
                  </Button>
                )}
                {currentUser && currentUser.id === user._id && (
                  <Button
                    variant="secondary"
                    onClick={() => navigate("/profile")}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {currentUser && (
        <RequestModal
          show={showRequestModal}
          onHide={() => setShowRequestModal(false)}
          targetUser={user}
          currentUser={currentUser}
        />
      )}
    </Container>
  );
};

export default UserDetailPage;
