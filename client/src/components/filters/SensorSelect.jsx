/**
 * SensorSelect.jsx
 *
 * Dropdown or selector for choosing which sensor type
 * (pH, EC, temperature, etc.) to display.
 *
 * Allows dynamic switching of data views without reloading pages.
 */

const DEFAULT_OPTIONS = [
	{ value: "all", label: "All Sensors" },
];

function SensorSelect({
	value = "all",
	onChange,
	options = DEFAULT_OPTIONS,
	label = "Sensor Type",
	id = "sensor-select",
}) {
	return (
		<label className="filter-control" htmlFor={id}>
			<span className="filter-label">{label}</span>
			<select
				id={id}
				className="filter-select"
				value={value}
				onChange={(event) => onChange?.(event.target.value)}
			>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</label>
	);
}

export default SensorSelect;
