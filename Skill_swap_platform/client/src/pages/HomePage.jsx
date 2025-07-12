import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Pagination,
  Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const HomePage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/users", {
        params: { page: currentPage, search, limit: 9 },
      });
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  const renderPagination = () => {
    const items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => setCurrentPage(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    return items;
  };

  return (
    <Container className="py-5">
      <h1 className="text-center mb-5">Find Skill Exchange Partners</h1>

      <Form onSubmit={handleSearch} className="mb-5">
        <Row>
          <Col md={9}>
            <Form.Control
              type="text"
              placeholder="Search by skill or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          <Col md={3}>
            <Button type="submit" variant="primary" className="w-100">
              Search
            </Button>
          </Col>
        </Row>
      </Form>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          <Row>
            {users.map((user) => (
              <Col key={user._id} md={4} className="mb-4">
                <Card
                  className="user-card h-100"
                  onClick={() => handleUserClick(user._id)}
                >
                  <Card.Body>
                    <div className="text-center mb-3">
                      <img
                        src={
                          user.profilePhoto || "https://via.placeholder.com/100"
                        }
                        alt={user.name}
                        className="profile-photo"
                      />
                    </div>
                    <h5 className="text-center">{user.name}</h5>
                    <p className="text-center text-muted">
                      {user.location || "Location not specified"}
                    </p>

                    <div className="mb-3">
                      <h6>Skills Offered:</h6>
                      <div>
                        {user.skillsOffered.map((skill, index) => (
                          <span key={index} className="skill-tag offered">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <h6>Skills Wanted:</h6>
                      <div>
                        {user.skillsWanted.map((skill, index) => (
                          <span key={index} className="skill-tag wanted">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      <small className="text-muted">
                        Available: {user.availability}
                      </small>
                    </div>
                  </Card.Body>
                  <Card.Footer className="text-center">
                    <Button
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (user) {
                          navigate(`/user/${user._id}`);
                        } else {
                          navigate("/login");
                        }
                      }}
                    >
                      View Profile
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>{renderPagination()}</Pagination>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default HomePage;
