import bcrypt from 'bcryptjs';
export const hash = (pw) => bcrypt.hashSync(pw, 10);
export const compare = (pw, hashed) => bcrypt.compareSync(pw, hashed);