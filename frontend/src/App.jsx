
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
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
import authApi from "./api/authApi";
import "./App.css";
import "./Auth.css";

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

function TicketTable({ tickets, onStatusChange, onDelete }) {
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
              </td>

              <td>{formatDate(ticket.createdAt)}</td>

              <td>{ticket.assignedTo || "Unassigned"}</td>

              <td>
                <button
                  className="icon-button table-action"
                  title="Delete ticket"
                  aria-label={`Delete ticket ${ticket.id}`}
                  onClick={() => onDelete(ticket.id)}
                >
                  <Trash2 size={16} />
                </button>
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
    assignedTo: "",
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

          <label>
            Assign to
            <input
              name="assignedTo"
              value={form.assignedTo}
              onChange={updateField}
              placeholder="Leave empty if unassigned"
            />
          </label>

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    };
  }, [tickets]);

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

    return [...result].sort((a, b) => {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [tickets, searchTerm, activePage]);

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
          {navigation.map(({ name, icon: Icon }) => (
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

            <button
              className="icon-button notification-button"
              title="Notifications"
              onClick={() =>
                window.alert(
                  counts.critical
                    ? `You have ${counts.critical} unresolved critical ticket(s).`
                    : "You have no critical ticket alerts."
                )
              }
            >
              <Bell size={18} />
              {counts.critical > 0 && <span className="notification-dot" />}
            </button>

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
                  ? "Dashboard"
                  : activePage}
              </h1>
              <p className="welcome-text">
                Welcome back, {currentUser.fullName.split(" ")[0]}. Here's what's happening with your team.
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
                    <span>Total tickets</span>
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
              </div>

              <section className="ticket-panel">
                <div className="panel-header">
                  <div>
                    <h2>Recent tickets</h2>
                    <p>Monitor and manage your latest support requests.</p>
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
                    onStatusChange={changeStatus}
                    onDelete={deleteTicket}
                  />
                )}
              </section>
            </>
          )}

          {activePage === "Tickets" && (
            <section className="ticket-panel">
              <div className="panel-header">
                <div>
                  <h2>All tickets</h2>
                  <p>
                    {filteredTickets.length} ticket(s) match your search.
                  </p>
                </div>
              </div>

              {loading && tickets.length === 0 ? (
                <div className="table-message">
                  <RefreshCw className="spin" size={25} />
                  <strong>Loading tickets...</strong>
                </div>
              ) : (
                <TicketTable
                  tickets={filteredTickets}
                  onStatusChange={changeStatus}
                  onDelete={deleteTicket}
                />
              )}
            </section>
          )}

          {activePage === "Users" && (
            <section className="placeholder-panel">
              <div className="placeholder-icon">
                <Users size={27} />
              </div>
              <h2>User management</h2>
              <p>
                User accounts and role-based access can be added when
                authentication is implemented in the backend.
              </p>
            </section>
          )}

          {activePage === "Reports" && (
            <section className="reports-grid">
              <article className="report-card">
                <div className="stat-icon blue">
                  <ClipboardList size={20} />
                </div>
                <span>Total tickets</span>
                <strong>{counts.total}</strong>
              </article>
              <article className="report-card">
                <div className="stat-icon orange">
                  <Clock3 size={20} />
                </div>
                <span>Still open or in progress</span>
                <strong>{counts.open + counts.progress}</strong>
              </article>
              <article className="report-card">
                <div className="stat-icon green">
                  <CheckCircle2 size={20} />
                </div>
                <span>Resolved or closed</span>
                <strong>{counts.resolved}</strong>
              </article>
            </section>
          )}

          {activePage === "Settings" && (
            <section className="settings-panel">
              <div className="settings-row">
                <div className="settings-icon">
                  {theme === "light" ? (
                    <Sun size={20} />
                  ) : (
                    <Moon size={20} />
                  )}
                </div>
                <div className="settings-copy">
                  <strong>Appearance</strong>
                  <span>Choose your preferred dashboard theme.</span>
                </div>
                <button
                  className="secondary-button"
                  onClick={() =>
                    setTheme((current) =>
                      current === "light" ? "dark" : "light"
                    )
                  }
                >
                  Switch to {theme === "light" ? "dark" : "light"}
                </button>
              </div>

              <div className="settings-row">
                <div className="settings-icon">
                  <Activity size={20} />
                </div>
                <div className="settings-copy">
                  <strong>Backend connection</strong>
                  <span>API endpoint: localhost:8080/api/tickets</span>
                </div>
                <button className="secondary-button" onClick={loadTickets}>
                  <RefreshCw size={15} />
                  Test connection
                </button>
              </div>
            </section>
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
