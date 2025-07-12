import React, { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Badge,
  Spinner,
  Alert,
  Tabs,
  Tab,
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import axios from "axios";
import { toast } from "react-toastify";

const RequestsPage = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("new-request", (request) => {
        setRequests((prev) => [request, ...prev]);
      });

      socket.on("request-updated", (updatedRequest) => {
        setRequests((prev) =>
          prev.map((req) =>
            req._id === updatedRequest._id ? updatedRequest : req
          )
        );
      });

      return () => {
        socket.off("new-request");
        socket.off("request-updated");
      };
    }
  }, [socket]);

  const fetchRequests = async () => {
    try {
      const response = await axios.get("/api/requests");
      setRequests(response.data);
    } catch (error) {
      setError("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      await axios.put(`/api/requests/${requestId}`, { status });
      toast.success(`Request ${status.toLowerCase()}!`);
      fetchRequests();
    } catch (error) {
      toast.error("Failed to update request");
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      Pending: "warning",
      Accepted: "success",
      Rejected: "danger",
    };
    return <Badge bg={variants[status]}>{status}</Badge>;
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
      </Container>
    );
  }

  const incomingRequests = requests.filter((req) => req.toUser._id === user.id);
  const outgoingRequests = requests.filter(
    (req) => req.fromUser._id === user.id
  );

  return (
    <Container className="py-5">
      <h1 className="mb-4">Skill Swap Requests</h1>

      <Tabs defaultActiveKey="incoming" className="mb-4">
        <Tab
          eventKey="incoming"
          title={`Incoming (${incomingRequests.length})`}
        >
          {incomingRequests.length === 0 ? (
            <Alert variant="info">No incoming requests</Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>From</th>
                  <th>Skill Offered</th>
                  <th>Skill Wanted</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomingRequests.map((request) => (
                  <tr key={request._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <img
                          src={
                            request.fromUser.profilePhoto ||
                            "https://via.placeholder.com/40"
                          }
                          alt={request.fromUser.name}
                          className="rounded-circle me-2"
                          style={{
                            width: "40px",
                            height: "40px",
                            objectFit: "cover",
                          }}
                        />
                        {request.fromUser.name}
                      </div>
                    </td>
                    <td>{request.skillOffered}</td>
                    <td>{request.skillWanted}</td>
                    <td>{request.message || "-"}</td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>
                      {request.status === "Pending" && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            className="me-2"
                            onClick={() =>
                              handleUpdateStatus(request._id, "Accepted")
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              handleUpdateStatus(request._id, "Rejected")
                            }
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Tab>

        <Tab
          eventKey="outgoing"
          title={`Outgoing (${outgoingRequests.length})`}
        >
          {outgoingRequests.length === 0 ? (
            <Alert variant="info">No outgoing requests</Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>To</th>
                  <th>Skill Offered</th>
                  <th>Skill Wanted</th>
                  <th>Message</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {outgoingRequests.map((request) => (
                  <tr key={request._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <img
                          src={
                            request.toUser.profilePhoto ||
                            "https://via.placeholder.com/40"
                          }
                          alt={request.toUser.name}
                          className="rounded-circle me-2"
                          style={{
                            width: "40px",
                            height: "40px",
                            objectFit: "cover",
                          }}
                        />
                        {request.toUser.name}
                      </div>
                    </td>
                    <td>{request.skillOffered}</td>
                    <td>{request.skillWanted}</td>
                    <td>{request.message || "-"}</td>
                    <td>{getStatusBadge(request.status)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default RequestsPage;
