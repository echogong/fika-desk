import type { JsonRpcConnection } from './rpc';

/** Startup configuration must also win over a model remembered by a resumed ACP session. */
export async function selectConfiguredModel(
  rpc: Pick<JsonRpcConnection, 'request'>,
  session: any,
  target: string | undefined,
  sessionId: string,
  timeout: number,
  allowUnlistedModel = false,
): Promise<any> {
  if (!target) return session;
  const matches = (value: unknown) => typeof value === 'string' && (value === target || value.startsWith(`${target}[`));
  const configs: any[] = Array.isArray(session?.configOptions) ? session.configOptions : [];
  const model = configs.find((o) => o?.category === 'model' && o?.type === 'select');
  const legacy = session?.models;
  if (model ? matches(model.currentValue) : matches(legacy?.currentModelId)) return session;
  const options: any[] = (model?.options ?? []).flatMap((o: any) => Array.isArray(o?.options) ? o.options : [o]);
  const selected = options.find((o) => o?.value === target) ?? options.find((o) => matches(o?.value));

  try {
    if (model && (selected || allowUnlistedModel)) {
      const value = selected?.value ?? target;
      const result = await rpc.request<any>('session/set_config_option', {
        sessionId, configId: model.id, value,
      }, timeout);
      const configOptions = Array.isArray(result?.configOptions)
        ? result.configOptions
        : configs.map((o) => o === model ? { ...o, currentValue: value } : o);
      const current = configOptions.find((o: any) => o?.category === 'model');
      if (!matches(current?.currentValue)) throw new Error('Agent 没有采用指定的模型');
      return { ...session, configOptions };
    }
    if (legacy) {
      // Some ACP adapters advertise a fixed catalogue, but accept configured provider IDs here.
      await rpc.request('session/set_model', { sessionId, modelId: target }, timeout);
      return {
        ...session,
        models: {
          ...legacy, currentModelId: target,
          availableModels: (legacy.availableModels ?? []).some((o: any) => o?.modelId === target)
            ? legacy.availableModels : [...(legacy.availableModels ?? []), { modelId: target, name: target }],
        },
        configOptions: model ? configs.map((o) => o === model
          ? { ...o, currentValue: target, options: [...(o.options ?? []), { value: target, name: target }] }
          : o) : session.configOptions,
      };
    }
    if (model) throw new Error('Agent 没有提供这个模型的切换入口');
    // Agents without ACP model metadata use their verified startup configuration driver.
    return session;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`无法采用已配置的模型 ${target}：${message}`);
  }
}
