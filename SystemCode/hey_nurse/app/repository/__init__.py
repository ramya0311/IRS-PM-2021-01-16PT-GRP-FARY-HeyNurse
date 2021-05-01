class Repository(object):
  def __init__(self, adapter=None):
    if not adapter:
      raise ValueError("Invalid repository implementation")
    self.client = adapter()

  def find_all(self, selector):
    return self.client.find_all(selector)

  def find(self, selector):
    return self.client.find(selector)

  def create(self, data):
    return self.client.create(data)

  def update(self, selector, data):
    return self.client.update(selector, data)

  def delete(self, selector):
    return self.client.delete(selector)

  def aggregate(self, selector):
    return self.client.aggregate(selector)
