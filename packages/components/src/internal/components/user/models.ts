import { Record } from 'immutable';

export class ChangePasswordModel extends Record({
    userId: undefined,
    oldPassword: '',
    password: '',
    password2: '',
}) {
    declare userId: number;
    declare oldPassword: string;
    declare password: string;
    declare password2: string;
}
