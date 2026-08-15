import asyncio
import random
import threading
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from app.database import SessionLocal
from app.services.ingestion_service import IngestionService
from app.services.decision_engine import DecisionEngine
from app.utils.logger import get_logger

logger = get_logger("services.demo_simulator")


class DemoSimulator:
    """
    Background simulation engine generating periodic realistic industrial IoT telemetry events
    and piping them through the end-to-end Decision Intelligence pipeline.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DemoSimulator, cls).__new__(cls)
            cls._instance.is_running = False
            cls._instance.task = None
            cls._instance.interval_seconds = 3
            cls._instance.total_events_generated = 0
            cls._instance.last_event_type = None
            cls._instance.last_event_timestamp = None
            cls._instance.active_scenario = "Industrial Equipment Monitoring"
            cls._instance._stop_event = threading.Event()
        return cls._instance

    def _generate_event_payload(self, scenario_type: str) -> Dict[str, Any]:
        """
        Synthesize realistic telemetry payload tailored to the scenario.
        """
        # Base nominal operating ranges
        temp_base = random.uniform(62.0, 68.0)
        press_base = random.uniform(28.0, 32.0)
        vib_base = random.uniform(3.5, 4.5)
        energy_base = random.uniform(240.0, 260.0)
        hum_base = random.uniform(42.0, 48.0)

        if scenario_type == "NORMAL_EVENT":
            return {
                "temperature": round(temp_base, 2),
                "pressure": round(press_base, 2),
                "vibration": round(vib_base, 2),
                "energy_usage": round(energy_base, 2),
                "humidity": round(hum_base, 2),
                "machine_id": "PUMP_TURBINE_01"
            }

        elif scenario_type == "ANOMALOUS_EVENT":
            # Spike temperature & vibration significantly
            return {
                "temperature": round(temp_base + random.uniform(35.0, 50.0), 2),
                "pressure": round(press_base + random.uniform(15.0, 25.0), 2),
                "vibration": round(vib_base + random.uniform(14.0, 22.0), 2),
                "energy_usage": round(energy_base + random.uniform(120.0, 200.0), 2),
                "humidity": round(hum_base, 2),
                "machine_id": "PUMP_TURBINE_01"
            }

        elif scenario_type == "MISSING_DATA_EVENT":
            # Missing temperature & vibration sensors
            return {
                "temperature": None,
                "pressure": round(press_base, 2),
                "vibration": None,
                "energy_usage": round(energy_base, 2),
                "humidity": round(hum_base, 2),
                "machine_id": "PUMP_TURBINE_01"
            }

        elif scenario_type == "CORRUPTED_DATA_EVENT":
            # Out of bounds extreme reading / sensor malfunction
            return {
                "temperature": 9999.0,
                "pressure": -50.0,
                "vibration": round(vib_base, 2),
                "energy_usage": round(energy_base, 2),
                "humidity": round(hum_base, 2),
                "machine_id": "PUMP_TURBINE_01"
            }

        elif scenario_type == "HIGH_RISK_EVENT":
            # Extreme multi-sensor divergence indicating imminent critical failure
            return {
                "temperature": round(temp_base + 65.0, 2),
                "pressure": round(press_base + 45.0, 2),
                "vibration": round(vib_base + 32.0, 2),
                "energy_usage": round(energy_base + 300.0, 2),
                "humidity": round(hum_base + 35.0, 2),
                "machine_id": "MAIN_GENERATOR_ALPHA"
            }

        elif scenario_type == "LOW_CONFIDENCE_EVENT":
            # Moderate sensor noise + missing fields causing elevated uncertainty
            return {
                "temperature": round(temp_base + 18.0, 2),
                "pressure": None,
                "vibration": round(vib_base + 6.0, 2),
                "energy_usage": None,
                "humidity": round(hum_base + 12.0, 2),
                "machine_id": "AUX_COMPRESSOR_03"
            }

        # Default fallback
        return {
            "temperature": round(temp_base, 2),
            "pressure": round(press_base, 2),
            "vibration": round(vib_base, 2),
            "energy_usage": round(energy_base, 2),
            "humidity": round(hum_base, 2),
            "machine_id": "PUMP_TURBINE_01"
        }

    def trigger_step(self, scenario_type: Optional[str] = None, custom_overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute a single simulation step through the live ingestion and decision engine pipeline.
        """
        scenarios = [
            "NORMAL_EVENT", "NORMAL_EVENT", "NORMAL_EVENT",
            "ANOMALOUS_EVENT", "MISSING_DATA_EVENT", "CORRUPTED_DATA_EVENT", "HIGH_RISK_EVENT", "LOW_CONFIDENCE_EVENT"
        ]
        chosen_scenario = scenario_type or random.choice(scenarios)
        payload = self._generate_event_payload(chosen_scenario)
        if custom_overrides:
            payload.update(custom_overrides)

        db = SessionLocal()
        try:
            # 1. Ingest Data Record
            record = IngestionService.ingest_sensor(
                db=db,
                data=payload,
                source=f"simulation_{chosen_scenario.lower()}",
                metadata={"simulation_scenario": chosen_scenario}
            )

            # 2. Feed directly into Central Decision Engine
            decision_eval = DecisionEngine.evaluate(
                db=db,
                data=record.processed_data,
                data_record_id=record.id,
                context={"simulation": True, "scenario": chosen_scenario},
                actor="DEMO_SIMULATOR"
            )

            self.total_events_generated += 1
            self.last_event_type = chosen_scenario
            self.last_event_timestamp = datetime.now(timezone.utc)

            logger.info(f"Demo Simulation Step [{chosen_scenario}] -> Decision: {decision_eval['decision']} (Risk: {decision_eval['risk_level']}, Conf: {decision_eval['confidence_score']})")
            return {
                "scenario": chosen_scenario,
                "data_record_id": record.id,
                "decision": decision_eval
            }
        finally:
            db.close()

    async def _run_async_loop(self):
        """Async loop for continuous periodic simulation."""
        while self.is_running:
            try:
                self.trigger_step()
            except Exception as e:
                logger.error(f"Error in simulation step: {e}", exc_info=True)
            await asyncio.sleep(self.interval_seconds)

    def start(self, interval_seconds: int = 3):
        """Start the background simulation."""
        if self.is_running:
            return
        self.interval_seconds = max(1, interval_seconds)
        self.is_running = True
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                self.task = asyncio.create_task(self._run_async_loop())
        except Exception:
            # If no running loop in current context, start via threading
            def _thread_target():
                new_loop = asyncio.new_event_loop()
                asyncio.set_event_loop(new_loop)
                new_loop.run_until_complete(self._run_async_loop())
            t = threading.Thread(target=_thread_target, daemon=True)
            t.start()
        logger.info(f"Demo Simulator started with {self.interval_seconds}s interval.")

    def stop(self):
        """Stop the background simulation."""
        self.is_running = False
        if self.task:
            self.task.cancel()
            self.task = None
        logger.info("Demo Simulator stopped.")

    def get_status(self) -> Dict[str, Any]:
        """Return live status of the demo simulator."""
        return {
            "is_running": self.is_running,
            "interval_seconds": self.interval_seconds,
            "total_events_generated": self.total_events_generated,
            "last_event_type": self.last_event_type,
            "last_event_timestamp": self.last_event_timestamp,
            "active_scenario": self.active_scenario
        }


# Global singleton instance
simulator = DemoSimulator()
