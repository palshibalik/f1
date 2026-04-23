import { useEffect, useState, useCallback } from "react";

function Countdown({ raceDate }) {
  const calculateTimeLeft = useCallback(() => {
    const difference = new Date(raceDate) - new Date();
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }, [raceDate]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  const units = [
    { val: timeLeft.days,    label: "Days"    },
    { val: timeLeft.hours,   label: "Hours"   },
    { val: timeLeft.minutes, label: "Minutes" },
    { val: timeLeft.seconds, label: "Seconds" },
  ];

  return (
    <div className="countdown">
      {units.map(({ val, label }) => (
        <div className="countdown-unit" key={label}>
          <span className="countdown-num">
            {String(val).padStart(2, "0")}
          </span>
          <span className="countdown-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default Countdown;