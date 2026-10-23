
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Ticket,
  Trash2,
  Users,
  X,
} from "lucide-react";

import ticketApi from "./api/ticketApi";
import agentApi from "./api/agentApi";
import authApi from "./api/authApi";
import userApi from "./api/userApi";
import "./App.css";
import "./Auth.css";
import "./EmployeeDashboard.css";
import "./UserManagement.css";
import "./Notifications.css";
import "./Reports.css";
import "./Settings.css";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Tickets", icon: Ticket },
  { name: "Users", icon: Users },
  { name: "Reports", icon: BarChart3 },
  { name: "Settings", icon: Settings },
];

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function readable(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(name) {
  return (name || "John Doe")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function TicketTable({ tickets, currentUser, onStatusChange, onDelete, onAssign }) {
  const [assignmentEmails, setAssignmentEmails] = useState({});
  const [agents, setAgents] = useState([]);
  const [agentSearch, setAgentSearch] = useState({});
  const [openAgentList, setOpenAgentList] = useState({});
  const [loadingAgents, setLoadingAgents] = useState(false);
  const canManageTickets = ["AGENT", "ADMIN"].includes(currentUser?.role);
  const canDeleteTickets = currentUser?.role === "ADMIN";

  useEffect(() => {
    if (!canManageTickets) return;

    let active = true;
    setLoadingAgents(true);

    agentApi.getAgents()
      .then((data) => {
        if (active) setAgents(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Unable to load agents:", error);
      })
      .finally(() => {
        if (active) setLoadingAgents(false);
      });

    return () => {
      active = false;
    };
  }, [canManageTickets]);

  if (tickets.length === 0) {
    return (
      <div className="table-message">
        <ClipboardList size={30} />
        <strong>No tickets found</strong>
        <span>Try changing your search or create a ticket.</span>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="ticket-table">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
            <th>Assignee</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <div className="ticket-title">
                  <span className="ticket-id">#{ticket.id}</span>
                  <strong>{ticket.title}</strong>
                  <span className="ticket-description">
                    {ticket.description || "No description provided"}
                  </span>
                </div>
              </td>

              <td>{ticket.category || "General"}</td>

              <td>
                <span
                  className={`priority-badge ${String(
                    ticket.priority || "MEDIUM"
                  ).toLowerCase()}`}
                >
                  <span className="status-dot" />
                  {readable(ticket.priority || "MEDIUM")}
                </span>
              </td>

              <td>
                {canManageTickets ? (
                  <select
                    className={`status-select ${String(
                      ticket.status || "OPEN"
                    ).toLowerCase()}`}
                    aria-label={`Change status for ticket ${ticket.id}`}
                    value={ticket.status || "OPEN"}
                    onChange={(event) =>
                      onStatusChange(ticket.id, event.target.value)
                    }
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                ) : (
                  <span>{readable(ticket.status || "OPEN")}</span>
                )}
              </td>

              <td>{formatDate(ticket.createdAt)}</td>

              <td>
                <div className="ticket-title">
                  <span>{ticket.assignedTo || "Unassigned"}</span>
                  {canManageTickets && (
                    <div className="assignment-controls agent-picker">
                      <input
                        type="text"
                        role="combobox"
                        aria-label={`Search agents for ticket ${ticket.id}`}
                        aria-expanded={Boolean(openAgentList[ticket.id])}
                        aria-controls={`agent-options-${ticket.id}`}
                        placeholder={loadingAgents ? "Loading agents..." : "Search agents..."}
                        autoComplete="off"
                        value={agentSearch[ticket.id] ?? ""}
                        disabled={loadingAgents}
                        onFocus={() =>
                          setOpenAgentList((current) => ({
                            ...current,
                            [ticket.id]: true,
                          }))
                        }
                        onChange={(event) => {
                          const value = event.target.value;
                          setAgentSearch((current) => ({
                            ...current,
                            [ticket.id]: value,
                          }));
                          setAssignmentEmails((current) => ({
                            ...current,
                            [ticket.id]: "",
                          }));
                          setOpenAgentList((current) => ({
                            ...current,
                            [ticket.id]: true,
                          }));
                        }}
                        onBlur={() =>
                          setTimeout(() =>
                            setOpenAgentList((current) => ({
                              ...current,
                              [ticket.id]: false,
                            })), 150)
                        }
                      />
                      {openAgentList[ticket.id] && (
                        <div
                          className="agent-options"
                          id={`agent-options-${ticket.id}`}
                          role="listbox"
                        >
                          {agents
                            .filter((agent) => {
                              const query = (agentSearch[ticket.id] ?? "").toLowerCase();
                              return `${agent.fullName} ${agent.email}`
                                .toLowerCase()
                                .includes(query);
                            })
                            .map((agent) => (
                              <button
                                type="button"
                                className="agent-option"
                                key={agent.id ?? agent.email}
                                role="option"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                  setAssignmentEmails((current) => ({
                                    ...current,
                                    [ticket.id]: agent.email,
                                  }));
                                  setAgentSearch((current) => ({
                                    ...current,
                                    [ticket.id]: `${agent.fullName} (${agent.email})`,
                                  }));
                                  setOpenAgentList((current) => ({
                                    ...current,
                                    [ticket.id]: false,
                                  }));
                                }}
                              >
                                <strong>{agent.fullName}</strong>
                                <small>{agent.email}</small>
                              </button>
                            ))}
                          {agents.filter((agent) => {
                            const query = (agentSearch[ticket.id] ?? "").toLowerCase();
                            return `${agent.fullName} ${agent.email}`
                              .toLowerCase()
                              .includes(query);
                          }).length === 0 && (
                            <span className="agent-empty">
                              {agents.length === 0 ? "No agents available" : "No matching agents"}
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={!assignmentEmails[ticket.id]}
                        onClick={async () => {
                          const success = await onAssign(
                            ticket.id,
                            assignmentEmails[ticket.id]
                          );
                          if (success) {
                            setAssignmentEmails((current) => ({
                              ...current,
                              [ticket.id]: "",
                            }));
                            setAgentSearch((current) => ({
                              ...current,
                              [ticket.id]: "",
                            }));
                          }
                        }}
                      >
                        Assign
                      </button>
                    </div>
                  )}
                </div>
              </td>

              <td>
                {canDeleteTickets && (
                  <button
                    className="icon-button table-action"
                    title="Delete ticket"
                    aria-label={`Delete ticket ${ticket.id}`}
                    onClick={() => onDelete(ticket.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateTicketModal({ onClose, onCreate, loading, currentUserName }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Technical Support",
    priority: "MEDIUM",
    createdBy: currentUserName,
  });

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.title.trim()) return;

    const created = await onCreate({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
    });

    if (created) onClose();
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="ticket-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-ticket-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">WORKSPACE / TICKETS</span>
            <h2 id="create-ticket-title">Create a ticket</h2>
            <p>Describe the issue so your team can help.</p>
          </div>

          <button
            className="icon-button"
            aria-label="Close modal"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>

        <form className="ticket-form" onSubmit={handleSubmit}>
          <label>
            Ticket title *
            <input
              name="title"
              value={form.title}
              onChange={updateField}
              placeholder="e.g. Laptop cannot connect to Wi-Fi"
              required
              maxLength={150}
            />
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              placeholder="Explain the issue in detail..."
              rows={4}
            />
          </label>

          <div className="form-grid">
            <label>
              Category
              <select
                name="category"
                value={form.category}
                onChange={updateField}
              >
                <option>Technical Support</option>
                <option>Hardware</option>
                <option>Software</option>
                <option>Network</option>
                <option>Access Request</option>
                <option>General</option>
              </select>
            </label>

            <label>
              Priority
              <select
                name="priority"
                value={form.priority}
                onChange={updateField}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading || !form.title.trim()}
            >
              <Plus size={16} />
              {loading ? "Creating..." : "Create ticket"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}



function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [roleChanges, setRoleChanges] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError("");

    try {
      const data = await userApi.getAll();
      const safeUsers = Array.isArray(data) ? data : [];
      setUsers(safeUsers);
      setRoleChanges(
        Object.fromEntries(safeUsers.map((user) => [user.id, user.role]))
      );
    } catch (err) {
      console.error("Unable to load users:", err);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Could not load users. Make sure you are signed in as an admin."
      );
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      loadUsers();
    } else {
      setLoadingUsers(false);
    }
  }, [currentUser, loadUsers]);

  async function handleUpdateRole(user) {
    const newRole = roleChanges[user.id];

    if (!newRole || newRole === user.role) return;

    if (user.id === currentUser.id) {
      setError("For safety, you cannot change your own role here.");
      return;
    }

    setUpdatingId(user.id);
    setError("");
    setSuccess("");

    try {
      const updatedUser = await userApi.updateRole(user.id, newRole);

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, ...updatedUser } : item
        )
      );
      setRoleChanges((current) => ({
        ...current,
        [user.id]: updatedUser.role,
      }));
      setSuccess(`Role updated for ${updatedUser.fullName}.`);
    } catch (err) {
      console.error("Unable to update user role:", err);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Could not update this user's role. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredUsers = users.filter((user) =>
    `${user.fullName} ${user.email} ${user.role}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  if (currentUser?.role !== "ADMIN") {
    return (
      <section className="placeholder-panel">
        <div className="placeholder-icon"><ShieldCheck size={27} /></div>
        <h2>Admin access required</h2>
        <p>Only administrators can view and manage user accounts.</p>
      </section>
    );
  }

  return (
    <section className="ticket-panel user-management-panel">
      <div className="panel-header">
        <div>
          <h2>User management</h2>
          <p>View accounts and manage access across your FlowDesk workspace.</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={loadUsers}
          disabled={loadingUsers}
        >
          <RefreshCw size={15} className={loadingUsers ? "spin" : ""} />
          {loadingUsers ? "Refreshing..." : "Refresh users"}
        </button>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="user-success-message" role="status">
          <CheckCircle2 size={17} />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess("")} aria-label="Dismiss success">
            <X size={15} />
          </button>
        </div>
      )}

      <div className="user-management-toolbar">
        <label className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, or role..."
            aria-label="Search users"
          />
          {search && (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear user search"
              onClick={() => setSearch("")}
            >
              <X size={14} />
            </button>
          )}
        </label>
        <span className="user-count">{filteredUsers.length} user(s)</span>
      </div>

      {loadingUsers ? (
        <div className="table-message">
          <RefreshCw className="spin" size={25} />
          <strong>Loading users...</strong>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="table-message">
          <Users size={28} />
          <strong>{users.length ? "No matching users" : "No users found"}</strong>
          <span>Try another search term.</span>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="ticket-table user-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Registered</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const selectedRole = roleChanges[user.id] || user.role;
                const isSelf = user.id === currentUser.id;

                return (
                  <tr key={user.id}>
                    <td>
                      <div className="user-table-identity">
                        <span className="avatar user-table-avatar">
                          {getInitials(user.fullName)}
                        </span>
                        <div className="ticket-title">
                          <strong>{user.fullName}</strong>
                          {isSelf && <span className="user-self-label">You</span>}
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <select
                        className="status-select user-role-select"
                        value={selectedRole}
                        disabled={isSelf || updatingId === user.id}
                        aria-label={`Role for ${user.fullName}`}
                        onChange={(event) =>
                          setRoleChanges((current) => ({
                            ...current,
                            [user.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="AGENT">Agent</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="secondary-button user-update-button"
                        disabled={
                          isSelf ||
                          updatingId === user.id ||
                          selectedRole === user.role
                        }
                        onClick={() => handleUpdateRole(user)}
                      >
                        {updatingId === user.id ? "Updating..." : "Update role"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


function AuthScreen({ theme, onThemeToggle, onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = mode === "register"
        ? await authApi.register({ fullName: fullName.trim(), email: email.trim(), password })
        : await authApi.login({ email: email.trim(), password });

      if (!result?.token || !result?.email) {
        throw new Error("The server returned an unexpected response.");
      }

      localStorage.setItem("flowdesk-token", result.token);
      localStorage.setItem("flowdesk-user", JSON.stringify({
        id: result.id,
        fullName: result.fullName,
        email: result.email,
        role: result.role,
      }));
      onAuthenticated({
        id: result.id,
        fullName: result.fullName,
        email: result.email,
        role: result.role,
      });
    } catch (err) {
      console.error("Authentication failed:", err);
      if (err.response?.status === 401) {
        setError("Incorrect email or password.");
      } else if (err.response?.status === 409) {
        setError("That email is already registered. Try signing in instead.");
      } else {
        setError(err.response?.data?.message || "Could not connect to FlowDesk. Check that the backend is running.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`auth-page ${theme === "dark" ? "dark" : ""}`}>
      <div className="auth-topbar">
        <div className="auth-brand">
          <div className="auth-brand-icon"><ShieldCheck size={25} /></div>
          <div><strong>FlowDesk</strong><span>IT SERVICE MANAGEMENT</span></div>
        </div>
        <button className="auth-theme-button" onClick={onThemeToggle} type="button">
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          {theme === "light" ? "Dark mode" : "Light mode"}
        </button>
      </div>

      <main className="auth-layout">
        <section className="auth-intro">
          <span className="auth-kicker">SUPPORT THAT FLOWS</span>
          <h1>Every issue.<br />One clear workspace.</h1>
          <p>Track requests, coordinate your team, and keep support work moving with FlowDesk.</p>
          <div className="auth-feature-list">
            <div><CheckCircle2 size={18} /><span>One place for support tickets</span></div>
            <div><CheckCircle2 size={18} /><span>Clear status and priority tracking</span></div>
            <div><CheckCircle2 size={18} /><span>Account-based access</span></div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-tabs">
            <button type="button" className={mode === "login" ? "active" : ""}
              onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
            <button type="button" className={mode === "register" ? "active" : ""}
              onClick={() => { setMode("register"); setError(""); }}>Create account</button>
          </div>
          <div className="auth-card-heading">
            <h2>{mode === "login" ? "Welcome back" : "Join FlowDesk"}</h2>
            <p>{mode === "login" ? "Enter your details to access your workspace." : "Create an employee account to get started."}</p>
          </div>
          {error && <div className="auth-error" role="alert">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <label>Full name
                <input value={fullName} onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name" autoComplete="name" maxLength={100} required />
              </label>
            )}
            <label>Email address
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com" autoComplete="email" required />
            </label>
            <label>Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "register" ? 8 : undefined} maxLength={72} required />
            </label>
            {mode === "register" && (
              <label>Confirm password
                <input type="password" value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter your password again" autoComplete="new-password"
                  minLength={8} maxLength={72} required />
              </label>
            )}
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign in to FlowDesk" : "Create account"}
            </button>
          </form>
          <p className="auth-footnote">
            {mode === "login" ? "New to FlowDesk? Choose Create account above." : "Public registrations receive the Employee role."}
          </p>
        </section>
      </main>
      <footer className="auth-footer">© 2026 FlowDesk · IT Service Management</footer>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("flowdesk-theme") || "light"
  );
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("flowdesk-user");
      const token = localStorage.getItem("flowdesk-token");
      return saved && token ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activePage, setActivePage] = useState("Dashboard");
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connectionState, setConnectionState] = useState("idle");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`flowdesk-read-notifications-${JSON.parse(localStorage.getItem("flowdesk-user") || "null")?.email || "guest"}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await ticketApi.getAll();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Unable to load tickets:", err);
      setError(
        "Could not load tickets. Check that the Spring Boot backend and PostgreSQL are running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) loadTickets();
  }, [currentUser, loadTickets]);

  useEffect(() => {
    localStorage.setItem("flowdesk-theme", theme);
  }, [theme]);

  const counts = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "OPEN").length,
      progress: tickets.filter(
        (ticket) => ticket.status === "IN_PROGRESS"
      ).length,
      resolved: tickets.filter((ticket) =>
        ["RESOLVED", "CLOSED"].includes(ticket.status)
      ).length,
      critical: tickets.filter(
        (ticket) =>
          ticket.priority === "CRITICAL" &&
          !["RESOLVED", "CLOSED"].includes(ticket.status)
      ).length,
      unassigned: tickets.filter(
        (ticket) => !ticket.assignedTo || !String(ticket.assignedTo).trim()
      ).length,
    };
  }, [tickets]);

  const notifications = useMemo(() => {
    if (!currentUser) return [];

    const items = [];
    const isSupport = ["ADMIN", "AGENT"].includes(currentUser.role);

    tickets.forEach((ticket) => {
      const status = ticket.status || "OPEN";
      const unresolved = !["RESOLVED", "CLOSED"].includes(status);
      const assigned = Boolean(ticket.assignedTo && String(ticket.assignedTo).trim());
      const createdByMe = [currentUser.email, currentUser.fullName]
        .filter(Boolean)
        .some((value) => String(ticket.createdBy || "").toLowerCase() === String(value).toLowerCase());

      if (isSupport && ticket.priority === "CRITICAL" && unresolved) {
        items.push({
          id: `critical-${ticket.id}`,
          ticketId: ticket.id,
          title: `Critical ticket #${ticket.id}`,
          message: ticket.title || "A critical ticket needs attention.",
          kind: "critical",
          createdAt: ticket.createdAt,
        });
      }

      if (isSupport && currentUser.role === "ADMIN" && unresolved && !assigned) {
        items.push({
          id: `unassigned-${ticket.id}`,
          ticketId: ticket.id,
          title: `Ticket #${ticket.id} is unassigned`,
          message: ticket.title || "Assign this ticket to a support agent.",
          kind: "unassigned",
          createdAt: ticket.createdAt,
        });
      }

      if (!isSupport && createdByMe && unresolved) {
        items.push({
          id: `my-ticket-${ticket.id}-${status}`,
          ticketId: ticket.id,
          title: `Ticket #${ticket.id}: ${String(status).replaceAll("_", " ").toLowerCase()}`,
          message: ticket.title || "Your support request has an update.",
          kind: status === "IN_PROGRESS" ? "progress" : "ticket",
          createdAt: ticket.createdAt,
        });
      }
    });

    return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [tickets, currentUser]);

  const unreadNotificationCount = notifications.filter(
    (item) => !readNotificationIds.includes(item.id)
  ).length;

  useEffect(() => {
    if (!currentUser?.email) return;
    localStorage.setItem(
      `flowdesk-read-notifications-${currentUser.email}`,
      JSON.stringify(readNotificationIds)
    );
  }, [readNotificationIds, currentUser]);

  function markAllNotificationsRead() {
    setReadNotificationIds((current) => Array.from(new Set([
      ...current,
      ...notifications.map((item) => item.id),
    ])));
  }

  function openNotification(item) {
    setReadNotificationIds((current) => current.includes(item.id) ? current : [...current, item.id]);
    setSearchTerm(String(item.ticketId));
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setActivePage("Tickets");
    setNotificationsOpen(false);
  }

  const filteredTickets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    let result = tickets;

    if (activePage === "Tickets") {
      result = tickets;
    }

    if (query) {
      result = result.filter((ticket) =>
        [
          ticket.id,
          ticket.title,
          ticket.description,
          ticket.category,
          ticket.priority,
          ticket.status,
          ticket.createdBy,
          ticket.assignedTo,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((ticket) => (ticket.status || "OPEN") === statusFilter);
    }

    if (categoryFilter !== "ALL") {
      result = result.filter((ticket) => (ticket.category || "General") === categoryFilter);
    }

    return [...result].sort((a, b) => {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [tickets, searchTerm, activePage, statusFilter, categoryFilter]);

  async function createTicket(ticket) {
    setLoading(true);
    setError("");

    try {
      await ticketApi.create(ticket);
      await loadTickets();
      setActivePage("Tickets");
      return true;
    } catch (err) {
      console.error("Unable to create ticket:", err);
      setError(
        err.response?.data?.message ||
          "Ticket creation failed. Check the backend and required fields."
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(id, status) {
    setError("");

    try {
      const updated = await ticketApi.updateStatus(id, status);

      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === id ? { ...ticket, ...updated, status } : ticket
        )
      );
    } catch (err) {
      console.error("Unable to update ticket:", err);
      setError("Could not update ticket status. Please try again.");
      await loadTickets();
    }
  }

  async function assignTicket(id, agentEmail) {
    setError("");

    try {
      const updated = await ticketApi.assign(id, agentEmail);
      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === id ? { ...ticket, ...updated } : ticket
        )
      );
      return true;
    } catch (err) {
      console.error("Unable to assign ticket:", err);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Could not assign ticket. Enter the email of an existing AGENT account."
      );
      return false;
    }
  }

  async function deleteTicket(id) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ticket #${id}?`
    );

    if (!confirmed) return;

    setError("");

    try {
      await ticketApi.delete(id);
      setTickets((current) => current.filter((ticket) => ticket.id !== id));
    } catch (err) {
      console.error("Unable to delete ticket:", err);
      setError("Could not delete the ticket. Please try again.");
    }
  }

  function handleAuthenticated(user) {
    setCurrentUser(user);
    setError("");
  }

  function handleLogout() {
    localStorage.removeItem("flowdesk-token");
    localStorage.removeItem("flowdesk-user");
    setCurrentUser(null);
    setTickets([]);
    setSearchTerm("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setActivePage("Dashboard");
    setShowCreateModal(false);
    setError("");
  }

  const pageTitle =
    activePage === "Dashboard" ? "Dashboard" : activePage;

  if (!currentUser) {
    return (
      <AuthScreen
        theme={theme}
        onThemeToggle={() =>
          setTheme((current) => (current === "light" ? "dark" : "light"))
        }
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <div className={`app ${theme === "dark" ? "dark" : ""}`}>
      {sidebarOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={25} />
          </div>

          <div>
            <h2>FlowDesk</h2>
            <p>IT SERVICE MANAGEMENT</p>
          </div>

          <button
            className="mobile-close icon-button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation
            .filter(({ name }) => name !== "Users" || currentUser.role === "ADMIN")
            .map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${
                activePage === name ? "active" : ""
              }`}
              onClick={() => {
                setActivePage(name);
                setSidebarOpen(false);
              }}
            >
              <Icon size={19} />
              <span>{name}</span>
              {name === "Tickets" && (
                <span className="nav-count">{tickets.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <CircleHelp size={19} />
            </div>
            <strong>Need some help?</strong>
            <p>Manage and track your team's support requests.</p>
            <button onClick={() => setActivePage("Tickets")}>
              View tickets <span>→</span>
            </button>
          </div>

          <div className="profile">
            <div className="avatar">{getInitials(currentUser.fullName)}</div>
            <div className="profile-info">
              <strong>{currentUser.fullName}</strong>
              <span>{currentUser.role}</span>
            </div>
            <button
              className="profile-menu icon-button"
              title="Log out" aria-label="Log out"
              onClick={handleLogout}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>

            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-separator">/</span>
              <strong>{pageTitle}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <Search size={17} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tickets..."
                aria-label="Search tickets"
              />
              {searchTerm && (
                <button
                  className="search-clear"
                  aria-label="Clear search"
                  onClick={() => setSearchTerm("")}
                >
                  <X size={14} />
                </button>
              )}
            </label>

            <div className="notification-wrapper">
              <button
                className="icon-button notification-button"
                title="Notifications"
                aria-label={`Notifications, ${unreadNotificationCount} unread`}
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell size={18} />
                {unreadNotificationCount > 0 && (
                  <span className="notification-count-badge">
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <section className="notification-popover" aria-label="Notifications panel">
                  <div className="notification-popover-header">
                    <div>
                      <h3>Notifications</h3>
                      <p>{unreadNotificationCount} unread</p>
                    </div>
                    <div className="notification-header-actions">
                      {unreadNotificationCount > 0 && (
                        <button type="button" className="notification-text-button" onClick={markAllNotificationsRead}>
                          <Check size={14} /> Mark all read
                        </button>
                      )}
                      <button type="button" className="notification-close" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="notification-empty">
                      <span className="notification-empty-icon"><Bell size={20} /></span>
                      <strong>You're all caught up</strong>
                      <p>New ticket alerts will appear here when there is something to review.</p>
                    </div>
                  ) : (
                    <div className="notification-list">
                      {notifications.map((item) => {
                        const isRead = readNotificationIds.includes(item.id);
                        return (
                          <button
                            type="button"
                            key={item.id}
                            className={`notification-item ${isRead ? "is-read" : "is-unread"} ${item.kind}`}
                            onClick={() => openNotification(item)}
                          >
                            <span className="notification-item-icon">
                              {item.kind === "critical" ? <AlertCircle size={17} /> : item.kind === "unassigned" ? <Users size={17} /> : item.kind === "progress" ? <Activity size={17} /> : <Ticket size={17} />}
                            </span>
                            <span className="notification-item-copy">
                              <strong>{item.title}</strong>
                              <span>{item.message}</span>
                              <small>{formatDate(item.createdAt)}</small>
                            </span>
                            {!isRead && <span className="notification-unread-dot" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <button type="button" className="notification-view-all" onClick={() => { setActivePage("Tickets"); setNotificationsOpen(false); }}>
                    View tickets <span>→</span>
                  </button>
                </section>
              )}
            </div>

            <button
              className="theme-button"
              onClick={() =>
                setTheme((current) =>
                  current === "light" ? "dark" : "light"
                )
              }
            >
              {theme === "light" ? (
                <Moon size={16} />
              ) : (
                <Sun size={16} />
              )}
              <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
            </button>
          </div>
        </header>

        <section className="dashboard">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">OVERVIEW</p>
              <h1>
                {activePage === "Dashboard"
                  ? (currentUser.role === "ADMIN" ? "Admin overview" : currentUser.role === "AGENT" ? "Agent workspace" : "Dashboard")
                  : activePage}
              </h1>
              <p className="welcome-text">
                {currentUser.role === "EMPLOYEE"
                  ? `Welcome back, ${currentUser.fullName.split(" ")[0]}. Track your support requests and follow their progress.`
                  : `Welcome back, ${currentUser.fullName.split(" ")[0]}. Here's what's happening with your team.`}
              </p>
            </div>

            <div className="dashboard-actions">
              <button
                className="secondary-button"
                onClick={loadTickets}
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "spin" : ""}
                />
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <button
                className="primary-button"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={17} />
                Create ticket
              </button>
            </div>
          </div>

          {error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={19} />
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={17} />
              </button>
            </div>
          )}

          {activePage === "Dashboard" && (
            <>
              <div className="stats-grid">
                <article className="stat-card">
                  <div className="stat-top">
                    <span>{currentUser.role === "EMPLOYEE" ? "My tickets" : "Total tickets"}</span>
                    <div className="stat-icon blue">
                      <ClipboardList size={20} />
                    </div>
                  </div>
                  <strong className="stat-number">{counts.total}</strong>
                  <div className="stat-footer">
                    <span className="stat-neutral">
                      All recorded tickets
                    </span>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Open tickets</span>
                    <div className="stat-icon orange">
                      <AlertCircle size={20} />
                    </div>
                  </div>
                  <strong className="stat-number">{counts.open}</strong>
                  <div className="stat-footer">
                    <span className="stat-neutral">
                      Awaiting resolution
                    </span>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>In progress</span>
                    <div className="stat-icon purple">
                      <Activity size={20} />
                    </div>
                  </div>
                  <strong className="stat-number">{counts.progress}</strong>
                  <div className="stat-footer">
                    <span className="stat-neutral">
                      Currently being handled
                    </span>
                  </div>
                </article>

                <article className="stat-card">
                  <div className="stat-top">
                    <span>Resolved</span>
                    <div className="stat-icon green">
                      <CheckCircle2 size={20} />
                    </div>
                  </div>
                  <strong className="stat-number">{counts.resolved}</strong>
                  <div className="stat-footer">
                    <span className="stat-neutral">
                      Resolved or closed
                    </span>
                  </div>
                </article>

                {currentUser.role === "ADMIN" && (
                  <>
                    <article className="stat-card">
                      <div className="stat-top">
                        <span>Unassigned tickets</span>
                        <div className="stat-icon orange">
                          <Users size={20} />
                        </div>
                      </div>
                      <strong className="stat-number">{counts.unassigned}</strong>
                      <div className="stat-footer">
                        <span className="stat-neutral">Need an agent assigned</span>
                      </div>
                    </article>

                    <article className="stat-card">
                      <div className="stat-top">
                        <span>Critical active</span>
                        <div className="stat-icon purple">
                          <AlertCircle size={20} />
                        </div>
                      </div>
                      <strong className="stat-number">{counts.critical}</strong>
                      <div className="stat-footer">
                        <span className="stat-neutral">Require attention</span>
                      </div>
                    </article>
                  </>
                )}
              </div>

              <section className="ticket-panel">
                <div className="panel-header">
                  <div>
                    <h2>{currentUser.role === "EMPLOYEE" ? "My recent tickets" : currentUser.role === "ADMIN" ? "Workspace tickets" : "Recent tickets"}</h2>
                    <p>{currentUser.role === "EMPLOYEE" ? "Check the latest updates on tickets you have submitted." : currentUser.role === "ADMIN" ? "Review incoming requests, priorities, assignments, and status." : "Review tickets currently assigned across the support team."}</p>
                  </div>

                  <button
                    className="view-all-button"
                    onClick={() => setActivePage("Tickets")}
                  >
                    View all tickets <span>→</span>
                  </button>
                </div>

                {loading && tickets.length === 0 ? (
                  <div className="table-message">
                    <RefreshCw className="spin" size={25} />
                    <strong>Loading tickets...</strong>
                  </div>
                ) : (
                  <TicketTable
                    tickets={filteredTickets.slice(0, 5)}
                    currentUser={currentUser}
                    onStatusChange={changeStatus}
                    onDelete={deleteTicket}
                    onAssign={assignTicket}
                  />
                )}
              </section>
            </>
          )}

          {activePage === "Tickets" && (
            <section className="ticket-panel">
              <div className="panel-header">
                <div>
                  <h2>{currentUser.role === "EMPLOYEE" ? "My tickets" : "All tickets"}</h2>
                  <p>
                    {filteredTickets.length} ticket(s) match your search.
                  </p>
                </div>
              </div>

              <div className="ticket-filters">
                <label>
                  <span>Status</span>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="ALL">All statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </label>
                <label>
                  <span>Category</span>
                  <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                    <option value="ALL">All categories</option>
                    {[...new Set(tickets.map((ticket) => ticket.category || "General"))].sort().map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </label>
                {(statusFilter !== "ALL" || categoryFilter !== "ALL") && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => { setStatusFilter("ALL"); setCategoryFilter("ALL"); }}
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {loading && tickets.length === 0 ? (
                <div className="table-message">
                  <RefreshCw className="spin" size={25} />
                  <strong>Loading tickets...</strong>
                </div>
              ) : (
                <TicketTable
                  tickets={filteredTickets}
                  currentUser={currentUser}
                  onStatusChange={changeStatus}
                  onDelete={deleteTicket}
                  onAssign={assignTicket}
                />
              )}
            </section>
          )}

          {activePage === "Users" && (
            <UserManagement currentUser={currentUser} />
          )}

          {activePage === "Reports" && (() => {
            const reportStatuses = [
              { label: "Open", value: counts.open, color: "#f59e0b" },
              { label: "In progress", value: counts.progress, color: "#8b5cf6" },
              { label: "Resolved / Closed", value: counts.resolved, color: "#22c55e" },
            ];
            const categoryCounts = tickets.reduce((result, ticket) => {
              const category = ticket.category || "General";
              result[category] = (result[category] || 0) + 1;
              return result;
            }, {});
            const categories = Object.entries(categoryCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6);
            const maxCategoryCount = Math.max(1, ...categories.map((item) => item[1]));
            const resolvedRate = counts.total
              ? Math.round((counts.resolved / counts.total) * 100)
              : 0;
            return (
              <div className="reports-page">
                <div className="reports-intro">
                  <div>
                    <span className="eyebrow">WORKSPACE ANALYTICS</span>
                    <h2>Ticket reports</h2>
                    <p>A clear overview of support demand and resolution progress.</p>
                  </div>
                  <div className="reports-live-label"><span /> Based on current ticket data</div>
                </div>

                <section className="reports-metrics">
                  <article className="report-metric report-metric-blue">
                    <div className="report-metric-top"><span>Total tickets</span><ClipboardList size={19} /></div>
                    <strong>{counts.total}</strong>
                    <small>Tickets visible to your account</small>
                  </article>
                  <article className="report-metric report-metric-orange">
                    <div className="report-metric-top"><span>Open tickets</span><AlertCircle size={19} /></div>
                    <strong>{counts.open}</strong>
                    <small>Waiting for support</small>
                  </article>
                  <article className="report-metric report-metric-purple">
                    <div className="report-metric-top"><span>In progress</span><Activity size={19} /></div>
                    <strong>{counts.progress}</strong>
                    <small>Currently being handled</small>
                  </article>
                  <article className="report-metric report-metric-green">
                    <div className="report-metric-top"><span>Resolved / closed</span><CheckCircle2 size={19} /></div>
                    <strong>{counts.resolved}</strong>
                    <small>{resolvedRate}% resolution rate</small>
                  </article>
                </section>

                <div className="reports-analysis-grid">
                  <section className="report-analysis-card">
                    <div className="report-section-heading">
                      <div><h3>Status breakdown</h3><p>Where tickets stand right now</p></div>
                      <BarChart3 size={19} />
                    </div>
                    <div className="report-status-list">
                      {reportStatuses.map((item) => {
                        const percentage = counts.total ? Math.round((item.value / counts.total) * 100) : 0;
                        return (
                          <div className="report-status-item" key={item.label}>
                            <div className="report-status-label"><span><i style={{ background: item.color }} />{item.label}</span><strong>{item.value}<small>{percentage}%</small></strong></div>
                            <div className="report-progress-track"><span style={{ width: `${percentage}%`, background: item.color }} /></div>
                          </div>
                        );
                      })}
                      {counts.total === 0 && <p className="report-empty-note">No ticket data is available yet.</p>}
                    </div>
                  </section>

                  <section className="report-analysis-card">
                    <div className="report-section-heading">
                      <div><h3>Tickets by category</h3><p>Most common support request types</p></div>
                      <ClipboardList size={19} />
                    </div>
                    {categories.length ? (
                      <div className="report-category-list">
                        {categories.map(([category, value]) => (
                          <div className="report-category-item" key={category}>
                            <div className="report-category-label"><span>{category}</span><strong>{value}</strong></div>
                            <div className="report-progress-track"><span style={{ width: `${(value / maxCategoryCount) * 100}%` }} /></div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="report-empty-note">Categories will appear when tickets are created.</p>}
                  </section>
                </div>

                <section className="report-resolution-card">
                  <div className="report-resolution-icon"><CheckCircle2 size={22} /></div>
                  <div className="report-resolution-copy"><h3>Resolution overview</h3><p>{counts.resolved} of {counts.total} tickets are resolved or closed.</p></div>
                  <div className="report-resolution-value">{resolvedRate}%</div>
                  <div className="report-resolution-track"><span style={{ width: `${resolvedRate}%` }} /></div>
                </section>
              </div>
            );
          })()}

          {activePage === "Settings" && (
            <div className="fd-settings">
              <div className="fd-settings-heading">
                <div>
                  <span className="eyebrow">YOUR WORKSPACE</span>
                  <h2>Workspace settings</h2>
                  <p>Manage your account, appearance, and connection preferences.</p>
                </div>
              </div>

              <section className="fd-settings-card">
                <div className="fd-settings-card-title">
                  <div className="fd-settings-symbol"><Users size={19} /></div>
                  <div><h3>My account</h3><p>Your signed-in FlowDesk profile</p></div>
                </div>
                <div className="fd-settings-profile">
                  <div className="fd-settings-avatar">{getInitials(currentUser.fullName)}</div>
                  <div><strong>{currentUser.fullName}</strong><span>{currentUser.email}</span></div>
                  <span className="fd-settings-role">{readable(currentUser.role)}</span>
                </div>
                <div className="fd-settings-detail-grid">
                  <div><span>Full name</span><strong>{currentUser.fullName}</strong></div>
                  <div><span>Email address</span><strong>{currentUser.email}</strong></div>
                  <div><span>Account role</span><strong>{readable(currentUser.role)}</strong></div>
                </div>
                <p className="fd-settings-note">Account details are read-only. Contact an administrator if your details need updating.</p>
              </section>

              <section className="fd-settings-card">
                <div className="fd-settings-card-title">
                  <div className="fd-settings-symbol"><Moon size={19} /></div>
                  <div><h3>Appearance</h3><p>Choose how FlowDesk looks on this device</p></div>
                </div>
                <div className="fd-settings-theme-options" role="group" aria-label="Color theme">
                  <button type="button" className={`fd-settings-theme-choice ${theme === "dark" ? "selected" : ""}`} onClick={() => setTheme("dark")} aria-pressed={theme === "dark"}>
                    <Moon size={19} /><span><strong>Dark</strong><small>Comfortable dark workspace</small></span>{theme === "dark" && <Check size={17} />}
                  </button>
                  <button type="button" className={`fd-settings-theme-choice ${theme === "light" ? "selected" : ""}`} onClick={() => setTheme("light")} aria-pressed={theme === "light"}>
                    <Sun size={19} /><span><strong>Light</strong><small>Bright workspace</small></span>{theme === "light" && <Check size={17} />}
                  </button>
                </div>
                <p className="fd-settings-note">Your preference is saved automatically in this browser.</p>
              </section>

              <section className="fd-settings-card">
                <div className="fd-settings-card-title">
                  <div className="fd-settings-symbol"><Activity size={19} /></div>
                  <div><h3>System connection</h3><p>Check whether the ticket service is reachable</p></div>
                </div>
                <div className="fd-settings-connection">
                  <div><strong>Spring Boot API</strong><span>localhost:8080/api/tickets</span></div>
                  <button type="button" className="secondary-button" disabled={connectionState === "checking"} onClick={async () => {
                    setConnectionState("checking");
                    try { await ticketApi.getAll(); setConnectionState("online"); }
                    catch { setConnectionState("offline"); }
                  }}><RefreshCw size={15} className={connectionState === "checking" ? "spin" : ""} /> {connectionState === "checking" ? "Checking..." : "Test connection"}</button>
                </div>
                <div className={`fd-settings-connection-status ${connectionState}`} role="status">
                  {connectionState === "online" ? "Connected successfully" : connectionState === "offline" ? "Connection failed. Check your backend and login." : connectionState === "checking" ? "Checking connection..." : "Run a connection test to check the API."}
                </div>
              </section>

              <section className="fd-settings-card">
                <div className="fd-settings-card-title">
                  <div className="fd-settings-symbol"><ShieldCheck size={19} /></div>
                  <div><h3>Session & security</h3><p>Manage your current sign-in session</p></div>
                </div>
                <div className="fd-settings-connection">
                  <div><strong>Signed in</strong><span>Log out when using a shared device.</span></div>
                  <button type="button" className="fd-settings-logout" onClick={handleLogout}><LogOut size={16} /> Sign out</button>
                </div>
              </section>
            </div>
          )}

          <footer className="app-footer">
            <span>© 2026 FlowDesk</span>
            <span>IT Service Management</span>
          </footer>
        </section>
      </main>

      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createTicket}
          loading={loading}
          currentUserName={currentUser.fullName}
        />
      )}
    </div>
  );
}
