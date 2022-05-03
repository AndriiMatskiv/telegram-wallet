import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt();
  return await bcrypt.hash(password, salt);
}

export const checkUserPassword = (password: string, hashPassword: string): Promise<boolean> => 
  bcrypt.compare(password, hashPassword);
