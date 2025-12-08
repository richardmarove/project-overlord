import { useEffect, useState } from 'react';

export default function StatCard({ title, value, icon, trend, trendValue }) {
    const [displayValue, setDisplayValue] = useState(0);

    // Animated counter effect
    useEffect(() => {
        if (typeof value !== 'number') {
            setDisplayValue(value);
            return;
        }

        let startValue = 0;
        const duration = 1500; // 1.5 seconds
        const increment = value / (duration / 16); // 60fps

        const timer = setInterval(() => {
            startValue += increment;
            if (startValue >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(startValue));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <div className="group relative p-6 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                        <span className="text-2xl">{icon}</span>
                    </div>

                    {trend && (
                        <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-green-400' : 'text-red-400'
                            }`}>
                            <span>{trend === 'up' ? '↑' : '↓'}</span>
                            <span>{trendValue}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
                    <p className="text-3xl font-bold text-white tabular-nums">
                        {typeof displayValue === 'number'
                            ? displayValue.toLocaleString()
                            : displayValue}
                    </p>
                </div>
            </div>
        </div>
    );
}
