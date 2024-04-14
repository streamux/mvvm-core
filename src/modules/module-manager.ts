import { addOnModule } from './add-on-module';

export class ModuleManager {
  private modulesMap: Map<string, any>;

  static create() {
    return new ModuleManager();
  }

  constructor() {
    this.modulesMap = new Map();
  }

  get modules() {
    return this.modulesMap;
  }

  set modules(modules: { [key: string]: any }) {
    Object.entries(modules).forEach(([key, module]) => {
      if (!module) return;

      this.modulesMap.set(key, addOnModule(module));
    });
  }
}
