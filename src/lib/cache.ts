import supabase from './supabase';

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from('cache')
      .select('value')
      .eq('key', key)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return data.value as T;
  } catch {
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  expiresIn: number = 3600 // Default 1 jam dalam detik
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

  try {
    await supabase
      .from('cache')
      .upsert({
        key,
        value,
        expires_at: expiresAt.toISOString(),
      })
      .eq('key', key);
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await supabase
      .from('cache')
      .delete()
      .eq('key', key);
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}