
import { useEffect, useState } from "react";
import "./FightLabCalendar.css";

// =========================================
// CALENDAR HELPERS
// =========================================

const weekdays = [
  "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
];

const formatDate = (year, month, day) => {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

export default function FightLabCalendar() {

  // =========================================
  // STATE
  // =========================================

  const [trainingPlans, setTrainingPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [formMessage, setFormMessage] = useState("");

  const [planForm, setPlanForm] = useState({
    fighter: "",
    focus: "",
    goal: "",
    recommendations: "",
    notes: "",
    scheduledDate: "",
    startTime: "18:00",
    duration: 60
  });

  const [currentMonth, setCurrentMonth] = useState(
    () => new Date()
  );

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();

    return formatDate(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
  });

  // =========================================
  // LOAD TRAINING SESSIONS FROM MONGODB
  // =========================================

  useEffect(() => {
    const token = sessionStorage.getItem(
      "fightlab_demo_token"
    );

    if (!token) {
      setLoadingPlans(false);
      setPlansError(
        "Please log in to view your training sessions."
      );
      return;
    }

    const controller = new AbortController();

    const fetchTrainingPlans = async () => {
      try {
        setLoadingPlans(true);
        setPlansError("");

        const response = await fetch(
          "/api/training-plans",
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Unable to load training sessions."
          );
        }

        if (!Array.isArray(data)) {
          throw new Error(
            "Unexpected training sessions response."
          );
        }

        setTrainingPlans(data);

      } catch (error) {
        if (error.name !== "AbortError") {
          setPlansError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPlans(false);
        }
      }
    };

    fetchTrainingPlans();

    return () => controller.abort();
  }, []);

  // =========================================
  // CALENDAR DATE CALCULATIONS
  // =========================================

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthTitle = currentMonth.toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric"
    }
  );

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const calendarDays = [
    ...Array(firstDay).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => index + 1
    )
  ];

  const changeMonth = (amount) => {
    setCurrentMonth(
      new Date(year, month + amount, 1)
    );
  };

  const selectedDatePlans = trainingPlans
    .filter(
      (plan) => plan.scheduledDate === selectedDate
    )
    .sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

  // =========================================
  // OPEN NEW TRAINING SESSION FORM
  // =========================================

  const openNewPlanForm = () => {
    setEditingPlanId(null);

    setPlanForm({
      fighter: "",
      focus: "",
      goal: "",
      recommendations: "",
      notes: "",
      scheduledDate: selectedDate,
      startTime: "18:00",
      duration: 60
    });

    setFormMessage("");
    setShowForm(true);
  };

  // =========================================
  // OPEN EDIT TRAINING SESSION FORM
  // =========================================

  const openEditPlanForm = (plan) => {
    setEditingPlanId(plan._id);

    setPlanForm({
      fighter: plan.fighter || "",
      focus: plan.focus || "",
      goal: plan.goal || "",
      recommendations: Array.isArray(
        plan.recommendations
      )
        ? plan.recommendations.join("\n")
        : "",
      notes: plan.notes || "",
      scheduledDate: plan.scheduledDate,
      startTime: plan.startTime,
      duration: plan.duration
    });

    setFormMessage("");
    setShowForm(true);
  };

  // =========================================
  // CANCEL FORM
  // =========================================

  const cancelPlanForm = () => {
    setShowForm(false);
    setEditingPlanId(null);
    setFormMessage("");
  };

  // =========================================
  // HANDLE FORM INPUT
  // =========================================

  const handlePlanFormChange = (event) => {
    const { name, value } = event.target;

    setPlanForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // =========================================
  // CREATE OR UPDATE TRAINING SESSION
  // =========================================

  const handleCreatePlan = async (event) => {
    event.preventDefault();

    if (savingPlan) return;

    const token = sessionStorage.getItem(
      "fightlab_demo_token"
    );

    if (!token) {
      setFormMessage("Please log in again.");
      return;
    }

    const isEditing = Boolean(editingPlanId);

    const payload = {
      fighter: planForm.fighter.trim(),
      focus: planForm.focus.trim(),
      goal: planForm.goal.trim(),
      recommendations: planForm.recommendations
        .split("\n")
        .map((recommendation) => recommendation.trim())
        .filter(Boolean),
      notes: planForm.notes.trim(),
      scheduledDate: planForm.scheduledDate,
      startTime: planForm.startTime,
      duration: Number(planForm.duration)
    };

    setSavingPlan(true);
    setFormMessage("");

    try {
      const response = await fetch(
        isEditing
          ? `/api/training-plans/${editingPlanId}`
          : "/api/training-plans",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(
            isEditing
              ? payload
              : { ...payload, status: "scheduled" }
          )
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          "Unable to save training session."
        );
      }

      const refreshResponse = await fetch(
        "/api/training-plans",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const refreshedPlans =
        await refreshResponse.json();

      if (!refreshResponse.ok) {
        throw new Error(
          refreshedPlans.message ||
          "Session saved, but calendar refresh failed."
        );
      }

      if (!Array.isArray(refreshedPlans)) {
        throw new Error(
          "Invalid training session data."
        );
      }

      setTrainingPlans(refreshedPlans);
      setPlansError("");

      setSelectedDate(payload.scheduledDate);

      const [newYear, newMonth] =
        payload.scheduledDate.split("-").map(Number);

      setCurrentMonth(
        new Date(newYear, newMonth - 1, 1)
      );

      setShowForm(false);
      setEditingPlanId(null);

      setFormMessage(
        isEditing
          ? "Training session updated successfully."
          : "Training session scheduled successfully."
      );

    } catch (error) {
      setFormMessage(error.message);
    } finally {
      setSavingPlan(false);
    }
  };

  // =========================================
  // UPDATE TRAINING SESSION STATUS
  // =========================================

  const handleUpdateStatus = async (planId, newStatus) => {
    if (savingPlan) return;

    const token = sessionStorage.getItem(
      "fightlab_demo_token"
    );

    if (!token) {
      setFormMessage("Please log in again.");
      return;
    }

    const allowedStatuses = [
      "scheduled",
      "completed",
      "cancelled"
    ];

    if (!allowedStatuses.includes(newStatus)) {
      setFormMessage("Invalid training session status.");
      return;
    }

    setSavingPlan(true);
    setFormMessage("");

    try {
      const response = await fetch(
        `/api/training-plans/${planId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: newStatus
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          "Unable to update training session status."
        );
      }

      const refreshResponse = await fetch(
        "/api/training-plans",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const refreshedPlans =
        await refreshResponse.json();

      if (!refreshResponse.ok) {
        throw new Error(
          refreshedPlans.message ||
          "Status updated, but calendar refresh failed."
        );
      }

      if (!Array.isArray(refreshedPlans)) {
        throw new Error(
          "Invalid calendar response."
        );
      }

      setTrainingPlans(refreshedPlans);
      setPlansError("");

      setFormMessage(
        `Training session marked as ${newStatus}.`
      );

    } catch (error) {
      setFormMessage(error.message);
    } finally {
      setSavingPlan(false);
    }
  };

  // =========================================
  // DELETE TRAINING SESSION
  // =========================================

  const handleDeletePlan = async (plan) => {
    if (savingPlan) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete your ${plan.fighter} training session on ${plan.scheduledDate} at ${plan.startTime}?`
    );

    if (!confirmed) return;

    const token = sessionStorage.getItem(
      "fightlab_demo_token"
    );

    if (!token) {
      setFormMessage("Please log in again.");
      return;
    }

    setSavingPlan(true);
    setFormMessage("");

    try {
      const response = await fetch(
        `/api/training-plans/${plan._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Unable to delete training session.";

        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message || errorMessage;
        } catch {
          // Keep the default error message.
        }

        throw new Error(errorMessage);
      }

      // Remove the deleted session immediately.
      setTrainingPlans((previousPlans) =>
        previousPlans.filter(
          (savedPlan) => savedPlan._id !== plan._id
        )
      );

      // Close the form if this session was being edited.
      if (editingPlanId === plan._id) {
        setShowForm(false);
        setEditingPlanId(null);
      }

      setPlansError("");
      setFormMessage(
        "Training session deleted successfully."
      );

    } catch (error) {
      setFormMessage(error.message);
    } finally {
      setSavingPlan(false);
    }
  };

  // =========================================
  // CALENDAR INTERFACE
  // =========================================

  return (
    <section className="fightlab-calendar">

      {/* CALENDAR HEADER */}

      <header className="fightlab-calendar-header">
        <div>
          <span>FIGHTLAB TRAINING SYSTEM</span>

          <h2>TRAINING CALENDAR</h2>

          <p>
            Schedule and manage your training sessions.
          </p>
        </div>
      </header>

      {/* MONTH NAVIGATION */}

      <div className="fightlab-calendar-navigation">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
        >
          ◀
        </button>

        <h3>{monthTitle}</h3>

        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
        >
          ▶
        </button>
      </div>

      {/* CALENDAR GRID */}

      <div className="fightlab-calendar-grid">
        {weekdays.map((day) => (
          <div
            className="fightlab-calendar-weekday"
            key={day}
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          if (day === null) {
            return (
              <div
                className="fightlab-calendar-empty"
                key={`empty-${index}`}
              />
            );
          }

          const date = formatDate(year, month, day);

          const isSelected =
            selectedDate === date;

          const hasSessions = trainingPlans.some(
            (plan) => plan.scheduledDate === date
          );

          return (
            <button
              type="button"
              key={date}
              className={[
                "fightlab-calendar-day",
                isSelected ? "selected" : "",
                hasSessions ? "has-sessions" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setSelectedDate(date)}
              aria-pressed={isSelected}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* SCHEDULE BUTTON */}

      <div className="fightlab-calendar-actions">
        <button
          type="button"
          className="fightlab-calendar-add-button"
          onClick={openNewPlanForm}
          disabled={savingPlan}
        >
          + SCHEDULE TRAINING SESSION
        </button>
      </div>

      {/* SUCCESS AND ERROR MESSAGES */}

      {formMessage && (
        <p
          className="fightlab-calendar-form-message"
          role="status"
        >
          {formMessage}
        </p>
      )}

      {/* CREATE AND EDIT FORM */}

      {showForm && (
        <form
          className="fightlab-calendar-form"
          onSubmit={handleCreatePlan}
        >
          <h3>
            {editingPlanId
              ? "EDIT TRAINING SESSION"
              : "NEW TRAINING SESSION"}
          </h3>

          <label>
            Fighter
            <input
              name="fighter"
              value={planForm.fighter}
              onChange={handlePlanFormChange}
              placeholder="Example: Ryu"
              required
            />
          </label>

          <label>
            Training Focus
            <input
              name="focus"
              value={planForm.focus}
              onChange={handlePlanFormChange}
              placeholder="Example: Anti-Air Training"
              required
            />
          </label>

          <label>
            Training Goal
            <input
              name="goal"
              value={planForm.goal}
              onChange={handlePlanFormChange}
              placeholder="Improve reaction timing"
              required
            />
          </label>

          <label>
            Recommendations (one per line)
            <textarea
              name="recommendations"
              value={planForm.recommendations}
              onChange={handlePlanFormChange}
              rows={4}
              placeholder={
                "Practice anti-airs\nReact to jump-ins"
              }
            />
          </label>

          <label>
            Notes
            <textarea
              name="notes"
              value={planForm.notes}
              onChange={handlePlanFormChange}
              rows={3}
              placeholder="Optional training notes"
            />
          </label>

          <div className="fightlab-calendar-form-row">
            <label>
              Training Date
              <input
                type="date"
                name="scheduledDate"
                value={planForm.scheduledDate}
                onChange={handlePlanFormChange}
                required
              />
            </label>

            <label>
              Start Time
              <input
                type="time"
                name="startTime"
                value={planForm.startTime}
                onChange={handlePlanFormChange}
                required
              />
            </label>

            <label>
              Duration (minutes)
              <input
                type="number"
                name="duration"
                value={planForm.duration}
                onChange={handlePlanFormChange}
                min="15"
                max="240"
                step="15"
                required
              />
            </label>
          </div>

          <div className="fightlab-calendar-form-buttons">
            <button
              type="submit"
              disabled={savingPlan}
            >
              {savingPlan
                ? "SAVING..."
                : editingPlanId
                  ? "UPDATE SESSION"
                  : "SAVE SESSION"}
            </button>

            <button
              type="button"
              onClick={cancelPlanForm}
              disabled={savingPlan}
            >
              CANCEL
            </button>
          </div>
        </form>
      )}

      {/* SELECTED DATE AND SAVED SESSIONS */}

      <div className="fightlab-calendar-details">
        <h3>SELECTED DATE</h3>

        <p>{selectedDate}</p>

        {loadingPlans && (
          <p>Loading training sessions...</p>
        )}

        {plansError && (
          <p
            role="alert"
            className="fightlab-calendar-error"
          >
            {plansError}
          </p>
        )}

        {!loadingPlans &&
          !plansError &&
          selectedDatePlans.length === 0 && (
            <p>
              No training sessions scheduled for this date.
            </p>
          )}

        {!loadingPlans &&
          !plansError &&
          selectedDatePlans.map((plan) => (
            <article
              className="fightlab-calendar-session"
              key={plan._id}
            >

              {/* SESSION HEADER */}

              <div className="fightlab-calendar-session-header">
                <h4>{plan.fighter}</h4>

                <span
                  className={`fightlab-session-status status-${plan.status}`}
                >
                  {plan.status}
                </span>
              </div>

              {/* SESSION ACTION BUTTONS */}

              <div className="fightlab-calendar-session-actions">

                <button
                  type="button"
                  onClick={() => openEditPlanForm(plan)}
                  disabled={savingPlan}
                >
                  EDIT SESSION
                </button>

                {plan.status !== "completed" && (
                  <button
                    type="button"
                    className="fightlab-session-complete"
                    onClick={() =>
                      handleUpdateStatus(
                        plan._id,
                        "completed"
                      )
                    }
                    disabled={savingPlan}
                  >
                    MARK COMPLETED
                  </button>
                )}

                {plan.status !== "cancelled" && (
                  <button
                    type="button"
                    className="fightlab-session-cancel"
                    onClick={() =>
                      handleUpdateStatus(
                        plan._id,
                        "cancelled"
                      )
                    }
                    disabled={savingPlan}
                  >
                    CANCEL SESSION
                  </button>
                )}

                {plan.status !== "scheduled" && (
                  <button
                    type="button"
                    className="fightlab-session-restore"
                    onClick={() =>
                      handleUpdateStatus(
                        plan._id,
                        "scheduled"
                      )
                    }
                    disabled={savingPlan}
                  >
                    RESTORE SCHEDULE
                  </button>
                )}

                <button
                  type="button"
                  className="fightlab-session-delete"
                  onClick={() => handleDeletePlan(plan)}
                  disabled={savingPlan}
                >
                  DELETE SESSION
                </button>
              </div>

              {/* SESSION DETAILS */}

              <p>
                <strong>Focus:</strong> {plan.focus}
              </p>

              <p>
                <strong>Goal:</strong> {plan.goal}
              </p>

              <p>
                <strong>Start:</strong> {plan.startTime}
              </p>

              <p>
                <strong>Duration:</strong>{" "}
                {plan.duration} minutes
              </p>

              {plan.notes && (
                <p>
                  <strong>Notes:</strong> {plan.notes}
                </p>
              )}

              {plan.recommendations?.length > 0 && (
                <div className="fightlab-calendar-recommendations">
                  <strong>
                    Training Recommendations
                  </strong>

                  <ul>
                    {plan.recommendations.map(
                      (recommendation, index) => (
                        <li key={index}>
                          {recommendation}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </article>
          ))}
      </div>
    </section>
  );
}
