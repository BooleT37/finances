import Source from "../models/Source";
import type { Option } from '../types'

class Sources {
  private sources: Source[]

  getAll(): Source[] {
    return this.sources
  }

  getByNameIfExists(name: string): Source | undefined {
    return this.sources.find(s => s.name === name)
  }

  getByName(name: string): Source {
    const source = this.getByNameIfExists(name)
    if (!source) {
      throw new Error(`Cannot find source with the name ${name}`)
    }
    return source
  }

  getByIdIfExists(id: number): Source | undefined {
    return this.sources.find(s => s.id === id)
  }

  getById(id: number): Source {
    const source = this.getByIdIfExists(id)
    if (!source) {
      throw new Error(`Cannot find source with the id ${id}`)
    }
    return source
  }

  set(sources: Source[]): void {
    this.sources = sources.map(s => new Source(s.id, s.name))
  }

  get asOptions(): Option[] {
    return this.sources.map(s => s.asOption)
  }
}

const sources = new Sources()

export default sources