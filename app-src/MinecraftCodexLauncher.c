#include <limits.h>
#include <mach-o/dyld.h>
#include <spawn.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>

extern char **environ;

static int open_path(const char *app_name, const char *path) {
  pid_t pid;
  char *const argv_with_app[] = {
    "/usr/bin/open",
    "-a",
    (char *)app_name,
    (char *)path,
    NULL
  };
  char *const argv_plain[] = {
    "/usr/bin/open",
    (char *)path,
    NULL
  };

  char *const *argv = app_name ? argv_with_app : argv_plain;
  int result = posix_spawn(&pid, "/usr/bin/open", NULL, NULL, argv, environ);
  if (result != 0) return result;

  int status = 0;
  waitpid(pid, &status, 0);
  return status;
}

int main(void) {
  char executable[PATH_MAX];
  uint32_t size = sizeof(executable);
  if (_NSGetExecutablePath(executable, &size) != 0) return 1;

  char *macos = strstr(executable, "/Contents/MacOS/");
  if (!macos) return 1;
  *macos = '\0';

  char game[PATH_MAX];
  snprintf(game, sizeof(game), "%s/Contents/Resources/index.html", executable);

  if (access("/Applications/Google Chrome.app", F_OK) == 0) {
    int result = open_path("Google Chrome", game);
    if (result == 0) return 0;
  }

  return open_path(NULL, game);
}
