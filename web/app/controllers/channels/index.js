import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { task } from "ember-concurrency";
import { set } from '@ember/object';
import { action } from '@ember/object';

export default class ChannelsIndexController extends Controller {
    @service session;
    @service currentUser;

    @(task(function * () {
        const res = yield this.store.findAll('channel');
        set(this, "channels", res);
        set(this, "account", yield this.currentUser.peek())
    })).on("init") getChannels;

    channels = null

    @action
    foo() {
        console.log(this.account);
    }
}
