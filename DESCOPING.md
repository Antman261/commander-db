# Descoping

Things we can descope for the first version:

| Item                                                | Reason                          | Alternative                                             |
| --------------------------------------------------- | ------------------------------- | ------------------------------------------------------- |
| Event lookup query conditions beyond `id === ${id}` | Won't implement complex indexes | Application builds a read model in an existing database |

