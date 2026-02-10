import React, { useEffect, useState } from 'react';

const CircularTimer = ({ duration, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (timeLeft / duration) * circumference;

    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onComplete]);

    return (
        <div className="relative flex items-center justify-center w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="gray"
                    strokeWidth="8"
                    fill="transparent"
                />
                <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke={timeLeft <= 3 ? '#ff0000' : '#ffcc00'}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-linear"
                />
            </svg>
            <span className="absolute text-xl font-bold text-white">{timeLeft}s</span>
        </div>
    );
};

export default CircularTimer;
