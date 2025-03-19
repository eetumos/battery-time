import GObject     from 'gi://GObject';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import Clutter     from 'gi://Clutter';

import {panel}           from 'resource:///org/gnome/shell/ui/main.js';
import * as SystemStatus from 'resource:///org/gnome/shell/ui/status/system.js';
import UPower            from 'gi://UPowerGlib';

const BatteryTimeIndicator = GObject.registerClass(
class BatteryTimeIndicator extends SystemStatus.Indicator {
    _sync() {
        super._sync();
        this._percentageLabel.visible = true;

        let upower = this._systemItem._powerToggle._proxy;
        let seconds;

        if (upower.State === UPower.DeviceState.CHARGING) {
            seconds = upower.TimeToFull;
        } else if (upower.State === UPower.DeviceState.DISCHARGING) {
            seconds = upower.TimeToEmpty;
        } else {
            return;
        }

        if (seconds === 0) {
            return;
        }

        let hours   = Math.floor(seconds / 60 / 60);
        let minutes = Math.floor(seconds / 60 % 60);
        
        this._percentageLabel.text = `${hours}\u2236${minutes.toString().padStart(2, "0")}`;
    }
});

export default class BatteryTimeExtension extends Extension {
    install() {
        this.indicator = new BatteryTimeIndicator();
        panel.statusArea.quickSettings._indicators.replace_child(panel.statusArea.quickSettings._system, this.indicator);
    }

    enable() {
        if (panel.statusArea.quickSettings._system) {
            this.install();
        }

        this.signalHandler = panel.statusArea.quickSettings._indicators.connect("child-added", (undefined, child) => {
            if (child instanceof SystemStatus.Indicator && !this.indicator) {
                this.install();
            }
        });
    }

    disable() {
        panel.statusArea.quickSettings._indicators.disconnect(this.signalHandler);
        delete this.signalHandler;

        if (this.indicator) {
            panel.statusArea.quickSettings._indicators.replace_child(this.indicator, panel.statusArea.quickSettings._system);
            delete this.indicator;
        }
    }
}
