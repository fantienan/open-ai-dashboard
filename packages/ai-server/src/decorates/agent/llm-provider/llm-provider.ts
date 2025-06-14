import { deepseek } from '@ai-sdk/deepseek'
import { createProviderRegistry } from 'ai'

const registry = createProviderRegistry({ deepseek })

export class LLMProvider {
  registry: typeof registry

  constructor() {
    this.registry = registry
  }
}
