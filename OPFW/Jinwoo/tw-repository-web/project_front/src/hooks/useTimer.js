import { useEffect, useState } from "react";

const useTimer = (delay, active) => {
    const [current, setCurrent] = useState(Date.now())
    const [delayValue, setDelayValue] = useState(delay)
    const [isActive, setIsActive] = useState(active)

    useEffect(() => {
        let timer = null
        if (typeof delayValue !== "number") {
            return
        }
        if (!isActive && timer) {
            clearInterval(timer)
            return
        }

        if (isActive) {
            timer = setInterval(() => {
                setCurrent(Date.now())
            }, delayValue);

            return () => clearInterval(timer)
        }
    }, [delayValue, isActive]);

    return [current, delayValue, isActive, setDelayValue, setIsActive];
}

export default useTimer;