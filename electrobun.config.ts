import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "Pump.studio",
		identifier: "studio.pump.app",
		version: "0.1.0",
	},
	build: {
		mac: {
			bundleCEF: false,
			icons: "icon.iconset",
		},
		linux: {
			bundleCEF: false,
		},
		win: {
			bundleCEF: false,
		},
	},
} satisfies ElectrobunConfig;
